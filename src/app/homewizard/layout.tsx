import HomeWizardNavigation from "../_components/Navigation/homewizard-navigation";

export const metadata = {
  title: "HomeWizard",
  description: "Täältä näet sähkömittarin tiedot.",
  // other metadata...
};

export default function HomeWizardLayout({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-screen-nhf flex-col items-center justify-center app-main-background text-white">
      <div className="container flex flex-col items-center justify-center gap-2 px-4 py-16 ">
        <div className="text-center">
          <HomeWizardNavigation />
        </div>
        {children}
      </div>
    </main>
  )
}