
import { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const API_URL = 'http://localhost:5000/api/products';

function App() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    id: '',
    name: '',
    category: '',
    price: '',
    quantity: ''
  });

  const [stockId, setStockId] = useState('');
  const [stockAmount, setStockAmount] = useState('');
  const [stockAction, setStockAction] = useState('in');

  // Get products from the backend
  async function loadProducts() {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error('Unable to load products.');
      }

      const data = await response.json();
      setProducts(data);
      setMessage('');
    } catch (error) {
      setMessage('Backend connection failed. Please start the backend server.');
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  // Handle form input
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  }

  // Add or update a product
  async function saveProduct(event) {
    event.preventDefault();

    if (
      !form.id.trim() ||
      !form.name.trim() ||
      !form.category.trim() ||
      form.price === '' ||
      form.quantity === ''
    ) {
      alert('Please fill in all fields.');
      return;
    }

    const price = Number(form.price);
    const quantity = Number(form.quantity);

    if (
      !Number.isFinite(price) ||
      !Number.isInteger(quantity) ||
      price < 0 ||
      quantity < 0
    ) {
      alert('Enter a valid price and a non-negative whole-number quantity.');
      return;
    }

    const productData = {
      id: form.id.trim(),
      name: form.name.trim(),
      category: form.category.trim(),
      price,
      quantity
    };

    try {
      const url =
        editingId !== null
          ? `${API_URL}/${encodeURIComponent(editingId)}`
          : API_URL;

      const response = await fetch(url, {
        method: editingId !== null ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(productData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Unable to save product.');
      }

      alert(editingId !== null ? 'Product updated!' : 'Product added!');

      setForm({
        id: '',
        name: '',
        category: '',
        price: '',
        quantity: ''
      });

      setEditingId(null);
      await loadProducts();
    } catch (error) {
      alert(error.message);
    }
  }

  // Edit product
  function editProduct(item) {
    setForm({
      id: item.id,
      name: item.name,
      category: item.category,
      price: String(item.price),
      quantity: String(item.quantity)
    });

    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Cancel editing
  function cancelEdit() {
    setForm({
      id: '',
      name: '',
      category: '',
      price: '',
      quantity: ''
    });

    setEditingId(null);
  }

  // Delete product
  async function deleteProduct(id) {
    if (!window.confirm('Do you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(id)}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Unable to delete product.');
      }

      alert('Product deleted!');
      await loadProducts();
    } catch (error) {
      alert(error.message);
    }
  }

  // Stock In and Stock Out
  async function updateStock(event) {
    event.preventDefault();

    const amount = Number(stockAmount);

    if (!stockId || !Number.isInteger(amount) || amount <= 0) {
      alert('Select a product and enter a positive whole-number quantity.');
      return;
    }

    const item = products.find((product) => product.id === stockId);

    if (!item) {
      alert('Product not found.');
      return;
    }

    const quantity =
      stockAction === 'in'
        ? item.quantity + amount
        : item.quantity - amount;

    if (quantity < 0) {
      alert('Not enough stock available.');
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/${encodeURIComponent(stockId)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ quantity })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Unable to update stock.');
      }

      alert('Stock updated successfully!');
      setStockId('');
      setStockAmount('');
      await loadProducts();
    } catch (error) {
      alert(error.message);
    }
  }

  // Search products
  const filteredProducts = products.filter((item) => {
    const text = search.toLowerCase();

    return (
      String(item.id).toLowerCase().includes(text) ||
      item.name.toLowerCase().includes(text) ||
      item.category.toLowerCase().includes(text)
    );
  });

  const totalStock = products.reduce(
    (total, item) => total + Number(item.quantity),
    0
  );

  const totalValue = products.reduce(
    (total, item) =>
      total + Number(item.price) * Number(item.quantity),
    0
  );

  return (
    <div className="container py-4">
      <h1 className="text-center text-primary mb-2">
        Inventory Management System
      </h1>

      <p className="text-center text-muted mb-4">
        Manage products and stock easily
      </p>

      {message && (
        <div className="alert alert-danger">
          {message}
          <button
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={loadProducts}
          >
            Retry
          </button>
        </div>
      )}

      {/* Dashboard */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card p-3">
            <h5>Total Products</h5>
            <h3>{products.length}</h3>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card p-3">
            <h5>Total Stock</h5>
            <h3>{totalStock}</h3>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card p-3">
            <h5>Total Inventory Value</h5>
            <h3>₹{totalValue.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      {/* Product Form */}
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          {editingId !== null ? 'Edit Product' : 'Add New Product'}
        </div>

        <div className="card-body">
          <form onSubmit={saveProduct}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Product ID</label>
                <input
                  className="form-control"
                  name="id"
                  value={form.id}
                  onChange={handleChange}
                  disabled={editingId !== null}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Product Name</label>
                <input
                  className="form-control"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Category</label>
                <input
                  className="form-control"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Price (₹)</label>
                <input
                  className="form-control"
                  type="number"
                  name="price"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Quantity</label>
                <input
                  className="form-control"
                  type="number"
                  name="quantity"
                  min="0"
                  step="1"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-4 d-flex align-items-end gap-2">
                <button className="btn btn-primary" type="submit">
                  {editingId !== null ? 'Update Product' : 'Add Product'}
                </button>

                {editingId !== null && (
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={cancelEdit}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Stock Management */}
      <div className="card mb-4">
        <div className="card-header bg-success text-white">
          Stock In / Stock Out
        </div>

        <div className="card-body">
          <form onSubmit={updateStock}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Select Product</label>
                <select
                  className="form-select"
                  value={stockId}
                  onChange={(event) => setStockId(event.target.value)}
                  required
                >
                  <option value="">Choose product</option>
                  {products.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.id} - {item.name} (Stock: {item.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">Quantity</label>
                <input
                  className="form-control"
                  type="number"
                  min="1"
                  step="1"
                  value={stockAmount}
                  onChange={(event) => setStockAmount(event.target.value)}
                  required
                />
              </div>

              <div className="col-md-2">
                <label className="form-label">Action</label>
                <select
                  className="form-select"
                  value={stockAction}
                  onChange={(event) => setStockAction(event.target.value)}
                >
                  <option value="in">Stock In</option>
                  <option value="out">Stock Out</option>
                </select>
              </div>

              <div className="col-md-3 d-flex align-items-end">
                <button className="btn btn-success w-100" type="submit">
                  Update Stock
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Search */}
      <div className="mb-3">
        <input
          className="form-control"
          placeholder="Search by ID, name, or category..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {/* Product Table */}
      <div className="card">
        <div className="card-header bg-dark text-white">
          Product Inventory
        </div>

        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                      <td>₹{Number(item.price).toFixed(2)}</td>
                      <td>{item.quantity}</td>
                      <td>
                        <button
                          className="btn btn-warning btn-sm me-2"
                          onClick={() => editProduct(item)}
                        >
                          Edit
                        </button>

                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteProduct(item.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <button
            className="btn btn-outline-primary"
            onClick={loadProducts}
          >
            Refresh Products
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

