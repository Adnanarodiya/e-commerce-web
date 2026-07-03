import ProductList from "@/components/home/ProductList";

export default function Home() {
  return (
    <div className="bg-background px-2 sm:px-4 py-6 sm:py-12 lg:py-16 lg:px-8 min-h-screen">
      <div className="text-center mx-auto mb-6 sm:mb-12 space-y-2 sm:space-y-3 px-1">
        <h1 className="text-primary leading-tight text-2xl sm:text-4xl font-semibold tracking-tight text-balance lg:leading-[1.1] xl:text-5xl">
          Expand Your Knowledge
        </h1>
        <p className="text-foreground text-xs sm:text-base max-w-3xl mx-auto text-balance sm:text-lg">
          Discover our curated collection of educational Islamic and Urdu books for children and beginners.
        </p>
      </div>
      <ProductList />
    </div>
  );
}
