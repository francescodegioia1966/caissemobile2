import React, { useState, useEffect, useRef, useCallback } from "react";

const MenuManagementView = ({ menu, onUpdateMenu, onClose }) => {
  const [editedMenu, setEditedMenu] = useState({ ...menu });
  const [newCategory, setNewCategory] = useState("");
  const [newItems, setNewItems] = useState({});
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [recentlyModified, setRecentlyModified] = useState(null);
  const [errors, setErrors] = useState({});
  const DESTINATIONS = {
    KITCHEN: "cucina",
    BAR: "bar",
  };
  const scrollRef = useRef(null);

  const sortMenu = (menu) => {
    const sortedMenu = {};
    const sortedCategories = Object.keys(menu).sort((a, b) =>
      a.localeCompare(b)
    );

    sortedCategories.forEach((category) => {
      sortedMenu[category] = menu[category].sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    });

    return sortedMenu;
  };

  useEffect(() => {
    if (recentlyModified && scrollRef.current) {
      const element = document.getElementById(recentlyModified);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setRecentlyModified(null);
    }
  }, [recentlyModified]);

  const handleSaveChanges = useCallback(() => {
    const sortedMenu = sortMenu(editedMenu);
    onUpdateMenu(sortedMenu);
  }, [editedMenu, onUpdateMenu]);

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setEditedMenu({ ...editedMenu, [newCategory.trim()]: [] });
      setNewCategory("");
      setRecentlyModified(newCategory.trim());
    }
  };

  const handleAddItem = (category) => {
    const newItem = newItems[category];
    const newErrors = {};

    if (!newItem || !newItem.name.trim()) {
      newErrors.name = true;
    }

    if (!newItem || !newItem.price) {
      newErrors.price = true;
    }

    if (!newItem || !newItem.destinazione) {
      newErrors.destinazione = true;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setEditedMenu({
        ...editedMenu,
        [category]: [
          ...editedMenu[category],
          {
            ...newItem,
            price: parseFloat(newItem.price),
            destinazione: newItem.destinazione,
          },
        ],
      });
      setNewItems({
        ...newItems,
        [category]: { name: "", price: "", destinazione: "" },
      });
      setRecentlyModified(`${category}-${newItem.name}`);
    }
  };

  const handleRemoveItem = (category, index) => {
    if (window.confirm("Sei sicuro di voler eliminare questo articolo?")) {
      const updatedMenu = { ...editedMenu };
      updatedMenu[category].splice(index, 1);
      setEditedMenu(updatedMenu);
      setEditingItem(null);
    }
  };

  const handleRemoveCategory = (category) => {
    if (
      window.confirm(
        "Sei sicuro di voler eliminare questa categoria? Tutti gli articoli in questa categoria saranno eliminati."
      )
    ) {
      const updatedMenu = { ...editedMenu };
      delete updatedMenu[category];
      setEditedMenu(updatedMenu);
      setEditingCategory(null);
    }
  };

  const handleEditItem = (category, index) => {
    setEditingCategory(null);
    const item = editedMenu[category][index];
    setEditingItem({ category, index, ...item });
  };

  const handleEditCategory = (category) => {
    setEditingItem(null);
    setEditingCategory(category);
    setNewCategoryName(category);
  };

  const handleSaveCategoryEdit = () => {
    if (newCategoryName.trim() && newCategoryName !== editingCategory) {
      const updatedMenu = { ...editedMenu };
      updatedMenu[newCategoryName.trim()] = updatedMenu[editingCategory];
      delete updatedMenu[editingCategory];
      setEditedMenu(updatedMenu);
      setRecentlyModified(newCategoryName.trim());
    }
    setEditingCategory(null);
  };

  const handleSaveItemEdit = () => {
    const { category, index, name, price, destinazione } = editingItem;
    const updatedMenu = { ...editedMenu };
    updatedMenu[category][index] = {
      name,
      price: parseFloat(price),
      destinazione,
    };
    setEditedMenu(updatedMenu);
    setEditingItem(null);
    setRecentlyModified(`${category}-${name}`);
  };

  const handleClose = () => {
    handleSaveChanges();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-auto h-full w-full flex items-center justify-center p-4">
      <div className="bg-gray-200 rounded-lg shadow-xl w-full max-w-3xl max-h-full overflow-y-auto relative">
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 transition-colors"
          title="Chiudi"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div className="p-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Gestione Menu
          </h3>
          {Object.entries(sortMenu(editedMenu)).map(([category, items]) => (
            <div
              key={category}
              id={category}
              className="mb-6 border-b pb-6"
              ref={category === recentlyModified ? scrollRef : null}
            >
              <div className="flex justify-between items-center mb-4 bg-blue-200 p-3 rounded-lg">
                {editingCategory === category ? (
                  <div className="flex items-center w-full">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="font-bold text-lg text-gray-800 border px-2 py-1 rounded flex-grow"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveCategoryEdit}
                      className="ml-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-bold"
                    >
                      Salva
                    </button>
                    <button
                      onClick={() => handleRemoveCategory(category)}
                      className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-bold"
                    >
                      Elimina
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center w-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      className="w-6 h-6 mr-2 text-gray-700"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 10h4a2 2 0 012 2v4m0 0v4m0-4H7a2 2 0 01-2-2v-4m0-4h10a2 2 0 012 2v4m0 0v4m0-4H9a2 2 0 01-2-2V6m0-4h10a2 2 0 012 2v4m0 0h4m-4 0a2 2 0 012 2v4m0 0v4m0-4h-4"
                      />
                    </svg>
                    <h4
                      className="font-bold text-xl text-gray-800 cursor-pointer flex-grow"
                      onClick={() => handleEditCategory(category)}
                    >
                      {category}
                    </h4>
                  </div>
                )}
              </div>
              {items.map((item, index) => (
                <div
                  key={index}
                  id={`${category}-${item.name}`}
                  className="flex justify-between items-center mb-4"
                  ref={
                    `${category}-${item.name}` === recentlyModified
                      ? scrollRef
                      : null
                  }
                >
                  <div className="flex items-center">
                    {editingItem &&
                    editingItem.category === category &&
                    editingItem.index === index ? (
                      <>
                        <input
                          type="text"
                          value={editingItem.name}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              name: e.target.value,
                            })
                          }
                          className="font-bold text-gray-700 border px-2 py-1 rounded"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={editingItem.price}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              price: e.target.value,
                            })
                          }
                          className="font-bold text-gray-700 border px-2 py-1 rounded ml-2"
                        />
                        <select
                          value={editingItem.destinazione}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              destinazione: e.target.value,
                            })
                          }
                          className="w-32 px-2 py-1 border rounded ml-2"
                        >
                          <option value="">Destinazione</option>
                          <option value={DESTINATIONS.KITCHEN}>Cucina</option>
                          <option value={DESTINATIONS.BAR}>Bar</option>
                        </select>
                        <button
                          onClick={() => handleRemoveItem(category, index)}
                          className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-bold"
                        >
                          Elimina
                        </button>
                        <button
                          onClick={handleSaveItemEdit}
                          className="ml-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-bold"
                        >
                          Salva
                        </button>
                      </>
                    ) : (
                      <span
                        className="font-bold text-gray-700 cursor-pointer"
                        onClick={() => handleEditItem(category, index)}
                      >
                        {item.name} - €{item.price.toFixed(2)} -{" "}
                        {item.destinazione}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div className="flex items-center mt-2">
                <input
                  type="text"
                  value={newItems[category]?.name || ""}
                  onChange={(e) =>
                    setNewItems({
                      ...newItems,
                      [category]: {
                        ...newItems[category],
                        name: e.target.value,
                      },
                    })
                  }
                  placeholder="Nome piatto"
                  className={`flex-grow px-2 py-1 border rounded mr-2 ${
                    errors.name ? "border-red-500" : ""
                  }`}
                />
                <input
                  type="text"
                  value={newItems[category]?.price || ""}
                  onChange={(e) =>
                    setNewItems({
                      ...newItems,
                      [category]: {
                        ...newItems[category],
                        price: e.target.value,
                      },
                    })
                  }
                  placeholder="Prezzo"
                  className={`w-24 px-2 py-1 border rounded mr-2 ${
                    errors.price ? "border-red-500" : ""
                  }`}
                />
                <select
                  value={newItems[category]?.destinazione || ""}
                  onChange={(e) =>
                    setNewItems({
                      ...newItems,
                      [category]: {
                        ...newItems[category],
                        destinazione: e.target.value,
                      },
                    })
                  }
                  className={`w-32 px-2 py-1 border rounded mr-2 ${
                    errors.destinazione ? "border-red-500" : ""
                  }`}
                >
                  <option value="">Destinazione</option>
                  <option value={DESTINATIONS.KITCHEN}>Cucina</option>
                  <option value={DESTINATIONS.BAR}>Bar</option>
                </select>
                <button
                  onClick={() => handleAddItem(category)}
                  className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors font-bold"
                >
                  Aggiungi
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-center mt-6">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nuova categoria"
              className="flex-grow px-2 py-1 border rounded mr-2"
            />
            <button
              onClick={handleAddCategory}
              className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-bold"
            >
              Aggiungi Categoria
            </button>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-400 text-black rounded hover:bg-gray-500 transition-colors font-bold flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-5 h-5 mr-1"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuManagementView;
