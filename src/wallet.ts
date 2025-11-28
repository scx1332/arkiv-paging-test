import {
	createPublicClient,
	createWalletClient,
	custom,
	http,
} from "@arkiv-network/sdk";
import { mendoza } from "@arkiv-network/sdk/chains";
import "viem/window";

async function switchToMendozaChain() {
	if (!window.ethereum) {
		throw new Error("MetaMask not installed");
	}

	const chainIdHex = `0x${mendoza.id.toString(16)}`;

	try {
		// Try to switch to the chain
		await window.ethereum.request({
			method: "wallet_switchEthereumChain",
			params: [{ chainId: chainIdHex }],
		});
	} catch (error: unknown) {
		// Chain doesn't exist, add it
		if (
			error &&
			typeof error === "object" &&
			"code" in error &&
			error.code === 4902
		) {
			await window.ethereum.request({
				method: "wallet_addEthereumChain",
				params: [
					{
						chainId: chainIdHex,
						chainName: mendoza.name,
						nativeCurrency: mendoza.nativeCurrency,
						rpcUrls: mendoza.rpcUrls.default.http,
						blockExplorerUrls: [mendoza.blockExplorers.default.url],
					},
				],
			});
		} else {
			throw error;
		}
	}
}

export async function connectWallet() {
	if (!window.ethereum) {
		throw new Error("MetaMask not installed");
	}

	// First switch to the correct chain
	await switchToMendozaChain();

	// Then request accounts
	const accounts = await window.ethereum.request({
		method: "eth_requestAccounts",
	});

	return accounts[0];
}

export function createArkivClients(account?: `0x${string}`) {
	if (!window.ethereum) {
		throw new Error("MetaMask not installed");
	}

	const publicClient = createPublicClient({
		chain: mendoza,
		transport: http(), // use the default RPC defined in the chain object
	});

	const walletClient = createWalletClient({
		chain: mendoza,
		transport: custom(window.ethereum), // use MetaMask to sign transactions
		account,
	});

	return { publicClient, walletClient };
}
