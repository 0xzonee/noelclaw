"use node";

import { action } from "./_generated/server";

const CA = "0xa57d8ce207c7daaeeed4e3a491bdf51d89233af3";
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ERC20_SUPPLY = "0x18160ddd";
const ERC20_BALANCE = "0x70a08231";

async function rpc(method: string, params: any[]) {
  const RPC = process.env.QUICKNODE_URL;
  if (!RPC) throw new Error("QUICKNODE_URL not set");
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`RPC error: ${data.error.message}`);
  return data.result;
}

function hexToDecimal(hex: string): bigint {
  return hex && hex !== "0x" ? BigInt(hex) : 0n;
}

// ── Top holders from recent Transfer events ───────────────────────────────
export const getTokenHolders = action({
  args: {},
  handler: async () => {
    const blockHex = await rpc("eth_blockNumber", []);
    const currentBlock = parseInt(blockHex, 16);
    const fromBlock = "0x" + Math.max(currentBlock - 5000, 0).toString(16);

    const logs = await rpc("eth_getLogs", [{
      address: CA,
      topics: [TRANSFER_TOPIC],
      fromBlock,
      toBlock: "latest",
    }]);

    const addresses = new Set<string>();
    for (const log of (logs || []).slice(0, 100)) {
      if (log.topics[1]) addresses.add("0x" + log.topics[1].slice(26));
      if (log.topics[2]) addresses.add("0x" + log.topics[2].slice(26));
    }

    const balancePromises = Array.from(addresses).slice(0, 20).map(async (addr) => {
      try {
        const result = await rpc("eth_call", [{
          to: CA,
          data: ERC20_BALANCE + addr.replace("0x", "").padStart(64, "0"),
        }, "latest"]);
        const balance = Number(hexToDecimal(result)) / 1e18;
        return { address: addr, balance };
      } catch { return null; }
    });

    const balances = (await Promise.all(balancePromises))
      .filter(b => b && b.balance > 0)
      .sort((a: any, b: any) => b.balance - a.balance);

    const supplyHex = await rpc("eth_call", [{ to: CA, data: ERC20_SUPPLY }, "latest"]);
    const totalSupply = Number(hexToDecimal(supplyHex)) / 1e18;

    const topHolders = balances.slice(0, 10).map((h: any) => ({
      address: h.address,
      balance: (h.balance / 1e6).toFixed(2),
      percentOwned: totalSupply > 0 ? (h.balance / totalSupply) * 100 : 0,
    }));

    return {
      success: true,
      topHolders,
      totalHolders: addresses.size,
      totalSupply: (totalSupply / 1e6).toFixed(0) + "M",
    };
  },
});

// ── Recent on-chain transfers ─────────────────────────────────────────────
export const getRecentTransfers = action({
  args: {},
  handler: async () => {
    const blockHex = await rpc("eth_blockNumber", []);
    const currentBlock = parseInt(blockHex, 16);
    const fromBlock = "0x" + Math.max(currentBlock - 2000, 0).toString(16);

    const logs = await rpc("eth_getLogs", [{
      address: CA,
      topics: [TRANSFER_TOPIC],
      fromBlock,
      toBlock: "latest",
    }]);

    const transfers = (logs || []).slice(-20).reverse().map((log: any) => {
      const from  = "0x" + log.topics[1]?.slice(26);
      const to    = "0x" + log.topics[2]?.slice(26);
      const value = Number(hexToDecimal(log.data)) / 1e18;
      return {
        from,
        to,
        value:    (value / 1e6).toFixed(2) + "M",
        rawValue: value,
        txHash:   log.transactionHash,
        block:    parseInt(log.blockNumber, 16),
      };
    }).filter((t: any) => t.rawValue > 0);

    return { success: true, transfers, currentBlock };
  },
});

// ── Network stats ─────────────────────────────────────────────────────────
export const getNetworkStats = action({
  args: {},
  handler: async () => {
    const [blockHex, gasPriceHex] = await Promise.all([
      rpc("eth_blockNumber", []),
      rpc("eth_gasPrice", []),
    ]);
    return {
      success: true,
      blockNumber:   parseInt(blockHex, 16),
      gasPriceGwei:  (Number(hexToDecimal(gasPriceHex)) / 1e9).toFixed(4),
      chain:         "Base Mainnet",
      rpcStatus:     "online",
    };
  },
});