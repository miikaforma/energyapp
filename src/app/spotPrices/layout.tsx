import SpotPriceNavigation from "../_components/Navigation/spotPrice-navigation";

export const metadata = {
  title: "Tuntihinta",
  description: "Täältä näet nykyiset tuntihinnat, tulevat tuntihinnat sekä tuntihintahistorian.",
  // other metadata...
};

export default function SpotPricesLayout({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-screen-nhf flex-col items-center justify-center app-main-background text-white">
      <div className="container flex flex-col items-center justify-center gap-2 px-4 py-16 ">
        <div className="text-center">
          <SpotPriceNavigation />
        </div>
        {children}
      </div>
    </main>
  )
}