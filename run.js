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


