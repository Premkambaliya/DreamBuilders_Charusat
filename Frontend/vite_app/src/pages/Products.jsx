import React, { useState, useEffect } from "react";
import { Package, Plus, X, Tag, FileText, Shield, Archive, ArrowRight } from "lucide-react";
import { productsApi } from "../api/api";
import ProductIntelligence from "./ProductIntelligence";

const Products = ({ user, token }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    productName: "",
    category: "",
    description: ""
  });
  const [formError, setFormError] = useState("");

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productsApi.getProducts(token);
      setProducts(response.products || []);
    } catch (err) {
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError("");
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!formData.productName) {
      setFormError("Product name is required.");
      return;
    }
    
    setAdding(true);
    try {
      await productsApi.addProduct(formData, token);
      setIsModalOpen(false);
      setFormData({ productName: "", category: "", description: "" });
      fetchProducts(); // Refresh list 
    } catch (err) {
      setFormError(err.message || "Failed to add product.");
    } finally {
      setAdding(false);
    }
  };

  // Only admin can add, but let's let admin view this page exclusively for now,
  // or employees can view the list (the implementation plan suggests it's an admin page).
  if (user?.role !== "admin") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <Shield size={48} className="mb-4 text-rose-500 opacity-50" />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="mt-2 text-slate-400">Only company administrators can manage products.</p>
      </div>
    );
  }

  // If a product is clicked, show its specific intelligence view
  if (selectedProduct) {
    return <ProductIntelligence product={selectedProduct} token={token} onBack={() => setSelectedProduct(null)} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Area */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package size={24} className="text-amber-400" />
            Product Portfolio
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Define the products your team sells to track performance and insights per product.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 text-sm font-semibold text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] transition hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-[#0f1222]"
        >
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {/* Main Content Area */}
      <div className="rounded-2xl border border-white/10 bg-[#121527]/90 p-5 shadow-[0_16px_50px_rgba(0,0,0,0.25)] backdrop-blur-md">
        {loading ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-amber-400" />
            <span className="text-sm font-medium text-slate-400">Loading products...</span>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 text-center text-rose-300">
            {error}
          </div>
        ) : products.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
              <Archive size={24} />
            </div>
            <h3 className="text-lg font-semibold text-white">No Products Yet</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-400">
              Add your first product to start tracking specific intelligence across sales calls.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((prod) => (
               <div 
                  key={prod._id} 
                  onClick={() => setSelectedProduct(prod)}
                  className="cursor-pointer group relative overflow-hidden flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.05] hover:border-amber-400/30 hover:shadow-lg hover:shadow-amber-500/5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                       <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 transition group-hover:scale-110 group-hover:bg-amber-500/20"><Tag size={16}/></span>
                       <h3 className="text-base font-bold text-white transition group-hover:text-amber-300">{prod.productName}</h3>
                    </div>
                  </div>
                  {prod.category && <span className="inline-flex w-fit rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] uppercase font-bold text-indigo-300">{prod.category}</span>}
                  <p className="text-sm text-slate-400 flex-1">{prod.description || "No description provided."}</p>
                  <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-3">
                     <span className="text-xs font-semibold text-slate-500 transition group-hover:text-slate-300">View Intelligence</span>
                     <ArrowRight size={14} className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-amber-400" />
                  </div>
               </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md scale-100 rounded-2xl border border-white/10 bg-[#121527] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Add New Product</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            {formError && (
              <div className="mb-4 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddProduct} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Product Name</label>
                <div className="relative">
                  <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-[#0f1222] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500/50 focus:bg-white/5 focus:ring-1 focus:ring-indigo-500/50"
                    placeholder="e.g. Dream CRM Pro"
                    disabled={adding}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Category (Optional)</label>
                <div className="relative">
                  <Archive size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-[#0f1222] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500/50 focus:bg-white/5 focus:ring-1 focus:ring-indigo-500/50"
                    placeholder="e.g. Enterprise Software"
                    disabled={adding}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Short Description</label>
                <div className="relative">
                  <FileText size={16} className="absolute left-3 top-3 text-slate-500" />
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-[#0f1222] py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500/50 focus:bg-white/5 focus:ring-1 focus:ring-indigo-500/50 resize-none"
                    placeholder="Main value proposition..."
                    disabled={adding}
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={adding}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 py-2.5 text-sm font-semibold text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] transition hover:bg-indigo-600 disabled:opacity-50"
                >
                  {adding ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  ) : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
