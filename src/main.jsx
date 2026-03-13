import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { PrivyProvider } from "@privy-io/react-auth";
import App from "./App.jsx";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || "your-privy-app-id";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["wallet", "email"],
        appearance: {
          theme: "dark",
          accentColor: "#1a4fff",
          // No custom logo — shows Privy default (trusted blue flame)
          showWalletLoginFirst: true,
        },
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
        defaultChain: {
          id: 8453,
          name: "Base",
          network: "base",
          nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
          rpcUrls: { default: { http: ["https://mainnet.base.org"] } },
        },
        supportedChains: [
          {
            id: 8453,
            name: "Base",
            network: "base",
            nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
            rpcUrls: { default: { http: ["https://mainnet.base.org"] } },
          },
        ],
      }}
    >
      <ConvexProvider client={convex}>
        <App />
      </ConvexProvider>
    </PrivyProvider>
  </StrictMode>
);