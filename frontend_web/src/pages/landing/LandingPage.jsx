// src/pages/landing/LandingPage.jsx
import React, { useEffect, useState } from "react";
import Navbar from "../../components/landing/Navbar";
import Hero from "../../components/landing/Hero";
import Categories from "../../components/landing/Categories";
import Services from "../../components/landing/Services";
import WhyChooseUs from "../../components/landing/WhyChooseUs";
import Reviews from "../../components/landing/Reviews";
import Footer from "../../components/landing/Footer";
import { getPublicHome } from "../../api/public";

const LandingPage = () => {
  const [homeData, setHomeData] = useState({
    banners: [],
    categories: [],
    services: [],
    reviews: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicHome()
      .then((res) => {
        const data = res.data || {};
        setHomeData({
          banners: data.banners || [],
          categories: data.categories || [],
          // Handle both popularServices or trendingServices from backend
          services:
            data.popularServices ||
            data.trendingServices ||
            data.services ||
            [],
          reviews: data.reviews || [],
        });
      })
      .catch((err) => {
        console.error("Error loading public home:", err);
        // keep defaults, show "Coming soon" sections
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-luxe-black text-white">
      <Navbar />
      <Hero banners={homeData.banners} loading={loading} />
      <Categories categories={homeData.categories} loading={loading} />
      <Services services={homeData.services} loading={loading} />
      <WhyChooseUs />
      <Reviews reviews={homeData.reviews} loading={loading} />
      <Footer />
    </div>
  );
};

export default LandingPage;
