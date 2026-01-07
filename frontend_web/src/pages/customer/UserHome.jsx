import { useEffect, useState } from "react";
import UserNavbar from "../../components/user/UserNavbar";
import CategorySection from "../../components/user/CategorySection";
import { getCategories, getServices } from "../../api/customer";
import ServiceCard from "../../components/user/ServiceCard";

export default function UserHome() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    getCategories().then(res => setCategories(res.data));
    getServices().then(res => setServices(res.data));
  }, []);

  const filteredServices = selectedCategory
    ? services.filter(s => s.categoryId === selectedCategory)
    : services;

  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">

        {/* Greeting */}
        <section>
          <h1 className="text-2xl font-semibold">
            Welcome 👋
          </h1>
          <p className="text-sm text-gray-600">
            Browse services and book your appointment
          </p>
        </section>

        {/* Categories */}
        <CategorySection
          categories={categories}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        {/* Services */}
        <section>
          <h2 className="text-lg font-semibold mb-4">
            Services
          </h2>

          {filteredServices.length === 0 ? (
            <p className="text-sm text-gray-500">
              No services available
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map(service => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
