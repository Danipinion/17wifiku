import { getNetworkData } from "../network-actions";
import NetworkDashboard from "../_components/NetworkDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Network Infrastructure Mapping | Admin Dashboard",
  description: "Manage and visualize network ODC, ODP, and client distribution with real-time mapping.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NetworkMapPage() {
  const data = await getNetworkData();

  return <NetworkDashboard data={data} />;
}
