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

    async dailyCheckIn() {
        const timestamp = Date.now();
        const message = `I am claiming my daily node point for ${this.wallet.address} at ${timestamp}`;
        const sign = await this.wallet.signMessage(message);
        return await this.makeRequest("post", "https://referralapi.layeredge.io/api/light-node/claim-node-points", { data: { sign, timestamp, walletAddress: this.wallet.address } });
    }

    async submitProof() {
        const timestamp = new Date().toISOString();
        const message = `I am submitting a proof for LayerEdge at ${timestamp}`;
        const sign = await this.wallet.signMessage(message);
        return await this.makeRequest("post", "https://dashboard.layeredge.io/api/send-proof", { data: { proof: "GmEdgesss", signature: sign, message, address: this.wallet.address } });
    }

    async claimLightNodePoints() {
        const timestamp = Date.now();
        const message = `I am claiming my light node run task node points for ${this.wallet.address} at ${timestamp}`;
        const sign = await this.wallet.signMessage(message);
        return await this.makeRequest("post", "https://referralapi.layeredge.io/api/task/node-points", { data: { walletAddress: this.wallet.address, timestamp, sign } });
    }

    async checkNodeStatus() {
        const response = await this.makeRequest("get", `https://referralapi.layeredge.io/api/light-node/node-status/${this.wallet.address}`);
        return response?.data?.data?.startTimestamp ? true : false;
    }

    async connectNode() {
        const timestamp = Date.now();
        const message = `Node activation request for ${this.wallet.address} at ${timestamp}`;
        const sign = await this.wallet.signMessage(message);
        return await this.makeRequest("post", `https://referralapi.layeredge.io/api/light-node/node-action/${this.wallet.address}/start`, { data: { sign, timestamp } });
    }

    async stopNode() {
        const timestamp = Date.now();
        const message = `Node deactivation request for ${this.wallet.address} at ${timestamp}`;
        const sign = await this.wallet.signMessage(message);
        return await this.makeRequest("post", `https://referralapi.layeredge.io/api/light-node/node-action/${this.wallet.address}/stop`, { data: { sign, timestamp } });
    }

    async checkNodePoints() {
        const response = await this.makeRequest("get", `https://referralapi.layeredge.io/api/referral/wallet-details/${this.wallet.address}`);
        return response?.data?.data?.nodePoints || 0;
    }
}


async function readWallets() {
    try {
        await fs.access("wallets.json");

        const data = await fs.readFile("wallets.json", "utf-8");
        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            logger.info("No wallets found in wallets.json");
            return [];
        }
        throw err;
    }
}

async function run() {
    // Display Banner
    console.log(banner.join('\n'));

    logger.info('JAWA IS KUNCI', 'J.W.P.A');
    await delay(3);

    const proxies = await readFile('proxy.txt');
    let wallets = await readWallets();
    
    if (proxies.length === 0) logger.warn('No Proxies', 'Running without proxy support');
    if (wallets.length === 0) {
        logger.error('Wallet Configuration Missing', 'Create wallets using "npm run autoref"');
        return;
    }

    logger.info('Wallet Processing', `Total Wallets: ${wallets.length}`);

    while (true) {
        for (let i = 0; i < wallets.length; i++) {
            const wallet = wallets[i];
            const proxy = proxies[i % proxies.length] || null;
            const { address, privateKey } = wallet;
            
            try {
                const socket = new LayerEdgeConnection(proxy, privateKey);
                
                logger.progress(address, 'Wallet Processing Started', 'start');
                logger.info(`Wallet Details`, `Address: ${address}, Proxy: ${proxy || 'No Proxy'}`);

                logger.progress(address, 'Checking Node Status', 'processing');
                const isRunning = await socket.checkNodeStatus();

                if (isRunning) {
                    logger.progress(address, 'Claiming Node Points', 'processing');
                    await socket.stopNode();
                }

                logger.progress(address, 'Reconnecting Node', 'processing');
                await socket.connectNode();

                logger.progress(address, 'Checking Node Points', 'processing');
                await socket.checkNodePoints();

                logger.progress(address, 'Wallet Processing Complete', 'success');
                await delay(3); // Wait 3 seconds before continuing with the next wallet
            } catch (error) {
                logger.error(`Error with wallet ${wallet.address}`, error.message);
            }
        }
    }
}

// Run the bot
run();
