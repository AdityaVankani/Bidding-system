import { useEffect, useState } from "react";
import axios from "axios";
import AuctionGrid from "../components/AuctionGrid";

const Home = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:5002/api/products");
        setProducts(res.data);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="max-w-7xl mx-auto pt-6 pb-12 px-4">
      <h1 className="text-3xl md:text-4xl font-serif font-bold text-center text-gray-800 mb-10">
        Explore Exquisite Auctions
      </h1>
      <p className="text-center text-gray-500 mb-10 max-w-2xl mx-auto text-sm">
        Browse through our curated selection of premium jewelry — place bids and
        own timeless elegance.
      </p>
      <AuctionGrid products={products} />
    </div>
  );
};

export default Home;