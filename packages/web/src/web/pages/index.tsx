import { AppProvider, useApp } from "../lib/store";
import { Shell } from "../components/cashfx/Shell";
import { HomeScreen } from "../components/cashfx/Home";
import { MarketsScreen } from "../components/cashfx/Markets";
import { HistoryScreen } from "../components/cashfx/History";
import { TradeScreen } from "../components/cashfx/Trade";
import { WalletScreen } from "../components/cashfx/Wallet";
import { AccountScreen } from "../components/cashfx/Account";

function Screens() {
  const { tab } = useApp();
  return (
    <Shell>
      <div key={tab} className="fade-in">
        {tab === "home" && <HomeScreen />}
        {tab === "markets" && <MarketsScreen />}
        {tab === "history" && <HistoryScreen />}
        {tab === "trade" && <TradeScreen />}
        {tab === "wallet" && <WalletScreen />}
        {tab === "account" && <AccountScreen />}
      </div>
    </Shell>
  );
}

export default function Index() {
  return <AppProvider><Screens /></AppProvider>;
}
