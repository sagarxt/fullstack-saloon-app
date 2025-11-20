import Navbar from "../components/Navbar";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-700 via-purple-700 to-pink-700 text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl font-bold leading-tight">
          Premium Salon Experience
        </h1>
        <p className="text-white/80 mt-4 text-lg max-w-2xl mx-auto">
          Earn rewards, redeem offers, and enjoy luxury grooming with our loyalty program.
        </p>
        <a
          href="#services"
          className="mt-8 inline-block bg-white text-indigo-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-200"
        >
          Explore Services
        </a>
      </section>

      {/* Services Section */}
      <section id="services" className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-10">Our Services</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[1,2,3].map((n) => (
            <div key={n} className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-lg">
              <h3 className="text-xl font-semibold mb-2">Service {n}</h3>
              <p className="text-white/70 text-sm mb-4">
                Premium hair, skin & grooming treatment.
              </p>
              <button className="bg-white text-indigo-700 px-4 py-2 rounded-xl">
                Book Now
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-10">What Our Customers Say</h2>

        <div className="space-y-6">
          {[1,2,3].map((n) => (
            <div key={n} className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20 shadow-lg">
              <p className="text-white/80">“Amazing experience! Highly recommended.”</p>
              <span className="text-white font-semibold">- Customer {n}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-10">Gallery</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map((n) => (
            <div key={n} className="h-40 bg-white/20 rounded-xl"></div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-10">Contact Us</h2>
        <p className="text-center text-white/70">
          Email: support@salon.com | Phone: +91 98765 43210
        </p>
      </section>

    </div>
  );
}
