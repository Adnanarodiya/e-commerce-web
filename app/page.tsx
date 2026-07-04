import HomeHero from "@/components/home/HomeHero";
import ProductList from "@/components/home/ProductList";

export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      <HomeHero />
      <section className="container mx-auto px-2 sm:px-4 lg:px-8 py-8 sm:py-12">
        <ProductList />
      </section>
    </div>
  );
}
