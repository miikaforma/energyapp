export const metadata = {
  title: "Statistiikka",
  description: "Täältä näet statistiikkaa kuten Fingridin tarjoamat sähkön kulutus ja tuotanto arvot sekä ennusteet.",
  // other metadata...
};

export default function StatisticsLayout({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode
}) {
  return (
    <main className="flex min-h-screen-nhf flex-col items-center justify-center app-main-background text-white">
      <div className="container flex flex-col items-center justify-center gap-2 px-4 py-16 ">
        {children}
      </div>
    </main>
  )
}