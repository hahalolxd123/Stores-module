import React, { useState, useRef, useEffect } from 'react';
import './StoreBill.css';
import { getAllInventory } from '../../Database/Database';
import MoveToInventoryPopup from './MoveToInventoryPopup';

function StoreBill({ products, bills, distributor, onBillClick, billid }) {
  const [addedProducts, setAddedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [showOptions, setShowOptions] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showInventoryPopup, setShowInventoryPopup] = useState(false);
  const [inventoryData, setInventoryData] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const nameRef = useRef(null);
  const quantityRef = useRef(null);
  const priceRef = useRef(null);

  useEffect(() => {
    // Load products from the selected bill when billid changes
    const selectedBill = bills.find(bill => bill.id === billid);
    if (selectedBill) {
      setAddedProducts(selectedBill.products);
    }
  }, [billid, bills]);

  const handleNameChange = (e) => {
    const { value } = e.target;
    setSearchTerm(value);
    // Filter products and variants based on search term
    const results = value ? products.filter(product =>
      product.productName.toLowerCase().includes(value.toLowerCase()) ||
      product.id.toLowerCase().includes(value.toLowerCase()) ||
      product.brand.toLowerCase().includes(value.toLowerCase()) ||
      product.category.toLowerCase().includes(value.toLowerCase()) ||
      (product.variants && product.variants.some(variant =>
        variant.variantName.toLowerCase().includes(value.toLowerCase())
      ))
    ) : [];
    setSearchResults(results);
    setSelectedSuggestionIndex(-1);
  };
  
  

  const handleSuggestionClick = (product) => {
    if (product.variantName) {
      nameRef.current.value = product.variantName;
    } else {
      nameRef.current.value = product.productName;
    }
    setSearchTerm('');
    setSearchResults([]);
    setSelectedSuggestionIndex(-1);
    quantityRef.current.focus();
  };
  

  const handleQuantityKeyDown = (e) => {
    if (e.key === 'Enter') {
      priceRef.current.focus();
    }
  };

  const handlePriceKeyDown = (e) => {
    if (e.key === 'Enter') {
      addProduct();
    }
  };

  const addProduct = () => {
    const selectedProduct = products.find(product => product.productName === nameRef.current.value);
    if (selectedProduct) {
      const newProduct = {
        id: selectedProduct.id,
        productName: selectedProduct.productName,
        quantity: quantityRef.current.value,
        price: priceRef.current.value
      };
      setAddedProducts([...addedProducts, newProduct]);
      nameRef.current.value = '';
      quantityRef.current.value = '';
      priceRef.current.value = '';
      nameRef.current.focus();
    }
  };

  const handleSuggestionHover = (index) => {
    setSelectedSuggestionIndex(index);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prevIndex => Math.max(prevIndex - 1, 0));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prevIndex => Math.min(prevIndex + 1, searchResults.length - 1));
    } else if (e.key === 'Enter' && selectedSuggestionIndex !== -1) {
      handleSuggestionClick(searchResults[selectedSuggestionIndex]);
    }
  };

  const handleOptionsClick = () => {
    setShowOptions(!showOptions);
  };

  const handleBillClick = () => {
    onBillClick(addedProducts, billid);
  };

  const moveToInventory = () => {
    setLoadingInventory(true);
    console.log("move to inventory clicked ", distributor.id, billid);
    getAllInventory()
      .then((inventory) => {
        setInventoryData(inventory);
        setShowInventoryPopup(true);
      })
      .catch((error) => {
        console.error("Error fetching inventory:", error);
      })
      .finally(() => {
        setLoadingInventory(false);
      });
  };

  return (
    <div className="store-bill">
      <h1>{distributor.DistributionBill}</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Product Name</th>
            <th>Quantity</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          {addedProducts.map((product, idx) => (
            <tr key={idx}>
              <td>{product.id}</td>
              <td>{product.productName}</td>
              <td>{product.quantity}</td>
              <td>{product.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="input-row">
        <input
          type="text"
          placeholder="Enter product name or ID"
          onChange={handleNameChange}
          onKeyDown={handleKeyDown}
          ref={nameRef}
        />
        <input
          type="text"
          placeholder="Enter quantity"
          onKeyDown={handleQuantityKeyDown}
          ref={quantityRef}
        />
        <input
          type="text"
          placeholder="Enter price"
          onKeyDown={handlePriceKeyDown}
          ref={priceRef}
        />
      </div>
      {addedProducts.length > 0 && (
        <div className="bill-products-section">
          <div className="options">
            <button onClick={handleBillClick}>Bill</button>
            <button onClick={moveToInventory} disabled={loadingInventory}>
              {loadingInventory ? "Loading Inventory..." : "Move to Inventory"}
            </button>
          </div>
        </div>
      )}
      {searchTerm && (
        <div className="search-results">
          {searchResults.map((product, index) => (
            <div
              key={index}
              className={`suggestion ${selectedSuggestionIndex === index ? 'selected' : ''}`}
              onClick={() => handleSuggestionClick(product)}
              onMouseEnter={() => handleSuggestionHover(index)}
            >
              <span>{product.id}</span>
              <span>{product.productName}</span>
              <span>{product.brand}</span>
              <span>{product.category}</span>
            </div>
          ))}
        </div>
      )}
      {showInventoryPopup && (
        <MoveToInventoryPopup
          inventoryData={inventoryData}
          billID={billid}
          distributorID = {distributor.id}
          onClose={() => setShowInventoryPopup(false)}
        />
      )}
    </div>
  );
}

export default StoreBill;
