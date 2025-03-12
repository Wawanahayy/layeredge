import fs from 'fs/promises';
import axios from "axios";
import chalk from "chalk";
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { Wallet } from "ethers";

// Banner
const banner = [
    chalk.bgCyan.black('============================================================'),
    chalk.bgGreen.black('=======================  J.W.P.A  =========================='),
    chalk.bgMagenta.white('================= @AirdropJP_JawaPride ====================='),
    chalk.bgYellow.black('=============== https://x.com/JAWAPRIDE_ID ================='),
    chalk.bgRed.white('============= https://linktr.ee/Jawa_Pride_ID =============='), 
    chalk.bgBlue.black('============================================================')
];

// Logger
const logger = {
    info: (message, value = '') => console.log(chalk.blueBright('[INFO]'), message, value),
    error: (message, value = '') => console.error(chalk.redBright('[ERROR]'), message, value),
    warn: (message, value = '') => console.warn(chalk.yellowBright('[WARN]'), message, value),
    success: (message, value = '') => console.log(chalk.greenBright('[SUCCESS]'), message, value),
    progress: (wallet, step, status) => {
        const statusIcon = status === 'success' ? chalk.green('✔') 
            : status === 'failed' ? chalk.red('✘') 
            : chalk.yellow('➤');
        console.log(chalk.cyan('◆ LayerEdge Auto Bot'), chalk.gray(`[${new Date().toLocaleTimeString()}]`), chalk.blueBright(`[PROGRESS]`), `${statusIcon} ${wallet} - ${step}`);
    }
};

// Delay Function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms * 1000));
}

// Read Wallets Function
async function readWallets() {
    try {
        const data = await fs.readFile("wallets.json", "utf-8");
        const wallets = JSON.parse(data);
        return wallets.filter(wallet => {
            if (!wallet.privateKey || !wallet.privateKey.startsWith("0x") || wallet.privateKey.length !== 66) {
                logger.warn(`Wallet tidak valid: ${JSON.stringify(wallet)}`);
                return false;
            }
            return true;
        });
    } catch (err) {
        logger.error("Gagal membaca wallets.json", err.message);
        return [];
    }
}

// Read Proxy File Function
async function readFile(pathFile) {
    try {
        const datas = await fs.readFile(pathFile, 'utf8');
        return datas.split('\n').map(data => data.trim()).filter(data => data.length > 0);
    } catch (error) {
        logger.error(`Error reading file: ${error.message}`);
        return [];
    }
}

// API Request Handler
class RequestHandler {
    static async makeRequest(config, retries = 30, backoffMs = 2000) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await axios(config);
                return response;
            } catch (error) {
                if (i === retries - 1) return null;
                await new Promise(resolve => setTimeout(resolve, backoffMs * Math.pow(1.5, i)));
            }
        }
        return null;
    }
}

// LayerEdge Connection Class
class LayerEdgeConnection {
    async checkNodePoints() {
        try {
            const response = await this.makeRequest(
                "get",
                `https://referralapi.layeredge.io/api/referral/wallet-details/${this.wallet.address}`
            );
            return response?.data?.data?.nodePoints || 0;
        } catch (error) {
            logger.error("Gagal memeriksa poin node", error.message);
            return 0;
        }
    }
    async connectNode() {
        try {
            const response = await this.makeRequest(
                "post",
                `https://referralapi.layeredge.io/api/light-node/node-action/${this.wallet.address}/start`
            );
            return response?.data?.message === "node action executed successfully";
        } catch (error) {
            logger.error("Gagal menghubungkan ulang node", error.message);
            return false;
        }
    }
    async stopNode() {
        try {
            const response = await this.makeRequest(
                "post",
                `https://referralapi.layeredge.io/api/light-node/node-action/${this.wallet.address}/stop`
            );
            return response?.data?.message === "node action executed successfully";
        } catch (error) {
            logger.error("Gagal menghentikan node", error.message);
            return false;
        }
    }
    constructor(proxy = null, privateKey = null, refCode = "T5zRD7dz") {
        this.refCode = refCode;
        this.proxy = proxy;
        this.wallet = new Wallet(privateKey);
        this.axiosConfig = {
            ...(this.proxy && { httpsAgent: this.newAgent(this.proxy) }),
            timeout: 60000,
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0',
                'Content-Type': 'application/json'
            }
        };
    }

    newAgent(proxy) {
        if (proxy.startsWith('http://')) return new HttpsProxyAgent(proxy);
        if (proxy.startsWith('socks4://') || proxy.startsWith('socks5://')) return new SocksProxyAgent(proxy);
        return null;
    }

    async makeRequest(method, url, config = {}) {
        return await RequestHandler.makeRequest({ method, url, ...this.axiosConfig, ...config }, 30);
    }

    async checkNodeStatus() {
        try {
            const response = await this.makeRequest(
                "get",
                `https://referralapi.layeredge.io/api/light-node/node-status/${this.wallet.address}`
            );
            return response?.data?.data?.startTimestamp !== null;
        } catch (error) {
            logger.error("Gagal memeriksa status node", error.message);
            return false;
        }
    }
}

// Run Script
async function run() {
    console.log(banner.join('\n'));
    logger.info('JAWA IS KUNCI', 'J.W.P.A');

    const proxies = await readFile('proxy.txt');
    let wallets = await readWallets();

    if (proxies.length === 0) logger.warn('No Proxies', 'Running without proxy support');
    if (wallets.length === 0) {
        logger.error('Wallet Configuration Missing', 'Harap tambahkan wallet ke wallets.json');
        return;
    }

    logger.info('Memproses Wallet', `Total Wallets: ${wallets.length}`);

    for (const wallet of wallets) {
        try {
            const socket = new LayerEdgeConnection(proxies[wallets.indexOf(wallet) % proxies.length] || null, wallet.privateKey);
            logger.progress(wallet.address, 'Memulai Proses Wallet', 'start');

            logger.progress(wallet.address, 'Memeriksa Status Node', 'processing');
            const isRunning = await socket.checkNodeStatus();

            if (isRunning) {
                logger.progress(wallet.address, 'Menghentikan Node', 'processing');
                await socket.stopNode();
            }

            logger.progress(wallet.address, 'Menghubungkan Ulang Node', 'processing');
            await socket.connectNode();

            logger.progress(wallet.address, 'Memeriksa Poin Node', 'processing');
            const points = await socket.checkNodePoints();
            logger.info(`Poin untuk ${wallet.address}:`, points);

            logger.progress(wallet.address, 'Selesai', 'success');
            await delay(3);
        } catch (error) {
            logger.error(`Kesalahan pada wallet ${wallet.address}`, error.message);
        }
    }
}

run();
