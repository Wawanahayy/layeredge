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

// Read File Function
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
    constructor(proxy = null, privateKey = null, refCode = "T5zRD7dz") {
        this.refCode = refCode;
        this.proxy = proxy;
        this.wallet = privateKey ? new Wallet(privateKey) : Wallet.createRandom();
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
}

// Run Script
async function run() {
    console.log(banner.join('\n'));
    logger.info('JAWA IS KUNCI', 'J.W.P.A');
}

run();
