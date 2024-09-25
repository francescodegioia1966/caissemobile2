// SplitPaymentView.jsx
import React, { useState } from "react";

const SplitPaymentView = ({ order, total, onClose, onAddSplitPayment }) => {
  const expandOrder = (order) => {
    const expanded = [];
    order.forEach((item) => {
      for (let i = 1; i <= item.quantity; i++) {
        expanded.push({
          uniqueId: `${item.id}-${i}`,
          id: item.id,
          name: item.name,
          price: item.price,
        });
      }
    });
    return expanded;
  };

  const [expandedOrder] = useState(expandOrder(order));

  const [customers, setCustomers] = useState([
    { id: 1, selectedItems: [], cash: "", card: "", isPaid: false },
  ]);

  const [remainingTotal, setRemainingTotal] = useState(total);
  const [assignedItems, setAssignedItems] = useState(new Set());

  const getAvailableItems = () => {
    return expandedOrder.filter((item) => !assignedItems.has(item.uniqueId));
  };

  const handleItemSelection = (uniqueId, customerId) => {
    setCustomers((prevCustomers) =>
      prevCustomers.map((customer) => {
        if (customer.id === customerId) {
          const isSelected = customer.selectedItems.includes(uniqueId);
          const newSelectedItems = isSelected
            ? customer.selectedItems.filter((id) => id !== uniqueId)
            : [...customer.selectedItems, uniqueId];
          return {
            ...customer,
            selectedItems: newSelectedItems,
          };
        }
        return customer;
      })
    );
  };

  const handlePaymentChange = (customerId, field, value) => {
    setCustomers((prevCustomers) =>
      prevCustomers.map((customer) =>
        customer.id === customerId ? { ...customer, [field]: value } : customer
      )
    );
  };

  const calculateCustomerTotal = (customer) => {
    return customer.selectedItems.reduce((sum, uniqueId) => {
      const item = expandedOrder.find((itm) => itm.uniqueId === uniqueId);
      return sum + (item.price || 0);
    }, 0);
  };

  const calculateCustomerPayment = (customer) => {
    return (parseFloat(customer.cash) || 0) + (parseFloat(customer.card) || 0);
  };

  const handleConfirmSplitPayment = () => {
    const currentCustomer = customers[customers.length - 1];
    const customerTotal = calculateCustomerTotal(currentCustomer);
    const customerPayment = calculateCustomerPayment(currentCustomer);

    if (customerPayment < customerTotal) {
      alert(
        `Il cliente ${
          currentCustomer.id
        } non ha pagato abbastanza per gli articoli selezionati (€${customerTotal.toFixed(
          2
        )}).`
      );
      return;
    }

    const change = customerPayment - customerTotal;
    if (change > 0) {
      alert(
        `Resto per il cliente ${currentCustomer.id}: €${change.toFixed(2)}`
      );
    }

    const newRemainingTotal = remainingTotal - customerTotal;
    setRemainingTotal(newRemainingTotal);

    const newAssignedItems = new Set(assignedItems);
    currentCustomer.selectedItems.forEach((uniqueId) => {
      newAssignedItems.add(uniqueId);
    });
    setAssignedItems(newAssignedItems);

    setCustomers((prevCustomers) =>
      prevCustomers.map((customer) =>
        customer.id === currentCustomer.id
          ? { ...customer, isPaid: true }
          : customer
      )
    );

    // Passa i pagamenti in contanti e carta al componente genitore
    onAddSplitPayment({
      cash: parseFloat(currentCustomer.cash) || 0,
      card: parseFloat(currentCustomer.card) || 0,
    });

    if (newRemainingTotal > 0) {
      setCustomers((prevCustomers) => [
        ...prevCustomers,
        {
          id: prevCustomers.length + 1,
          selectedItems: [],
          cash: "",
          card: "",
          isPaid: false,
        },
      ]);
    } else {
      alert("Il pagamento globale è stato completato.");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
              Pagamento Separato
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ✖️
            </button>
          </div>

          {/* Sezione Clienti */}
          {customers.map((customer) => (
            <div
              key={customer.id}
              className={`border p-4 rounded-md mb-4 ${
                customer.isPaid ? "bg-gray-200" : "bg-gray-50"
              } ${customer.isPaid ? "text-sm" : "text-base"}`}
            >
              <h3 className="text-xl font-semibold mb-2">
                Cliente {customer.id}
              </h3>

              {customer.isPaid ? (
                <div className="mb-4">
                  <label className="block text-md font-semibold text-gray-700">
                    Articoli Pagati:
                  </label>
                  <ul className="list-disc list-inside">
                    {customer.selectedItems.map((uniqueId) => {
                      const item = expandedOrder.find(
                        (itm) => itm.uniqueId === uniqueId
                      );
                      return (
                        <li key={uniqueId}>
                          {item.name} - €{item.price.toFixed(2)}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-md font-semibold text-gray-700">
                      Seleziona Articoli:
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                      {getAvailableItems().map((item) => (
                        <label
                          key={item.uniqueId}
                          className="flex items-center"
                        >
                          <input
                            type="checkbox"
                            checked={customer.selectedItems.includes(
                              item.uniqueId
                            )}
                            onChange={() =>
                              handleItemSelection(item.uniqueId, customer.id)
                            }
                            className="mr-2"
                          />
                          {item.name} - €{item.price.toFixed(2)}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <span className="text-lg font-semibold">
                      Totale Articoli: €
                      {calculateCustomerTotal(customer).toFixed(2)}
                    </span>
                  </div>
                  <div className="mb-4">
                    <label className="block text-md font-semibold text-gray-700">
                      Contanti ricevuti:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={customer.cash}
                      onChange={(e) =>
                        handlePaymentChange(customer.id, "cash", e.target.value)
                      }
                      className="mt-1 block w-full text-md font-semibold border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-md font-semibold text-gray-700">
                      Pagamento con carta:
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={customer.card}
                      onChange={(e) =>
                        handlePaymentChange(customer.id, "card", e.target.value)
                      }
                      className="mt-1 block w-full text-md font-semibold border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="mb-4 text-md font-semibold text-gray-800">
                    Resto: €
                    {(
                      calculateCustomerPayment(customer) -
                      calculateCustomerTotal(customer)
                    ).toFixed(2)}
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Pulsanti di Azione */}
          <div className="flex justify-end space-x-2 mb-4">
            <button
              className={`px-4 py-2 text-md font-semibold bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 ${
                remainingTotal <= 0 ? "hidden" : ""
              }`}
              onClick={handleConfirmSplitPayment}
            >
              Conferma Pagamento Cliente {customers.length}
            </button>
          </div>

          {/* Indicazione dell'Importo Rimanente */}
          <div className="mb-4 text-lg font-semibold text-gray-800">
            Importo rimanente da pagare: €{remainingTotal.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplitPaymentView;
