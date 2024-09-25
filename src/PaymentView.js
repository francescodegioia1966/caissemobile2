// PaymentView.jsx
import React, { useState, useEffect } from "react";
import SplitPaymentView from "./SplitPaymentView";

const PaymentView = ({ order, tableName, onClose, onConfirmPayment }) => {
  const [cashReceived, setCashReceived] = useState("");
  const [cardPayment, setCardPayment] = useState("");
  const [splitPayments, setSplitPayments] = useState([]);
  const [change, setChange] = useState(0);
  const [firstFieldFocused, setFirstFieldFocused] = useState(false);
  const [isSplitPayment, setIsSplitPayment] = useState(false);

  const total = order.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Calcola la somma dei pagamenti diretti
  const directPayment =
    (parseFloat(cashReceived) || 0) + (parseFloat(cardPayment) || 0);

  // Calcola la somma dei pagamenti tramite split payment
  const splitPaymentCashTotal = splitPayments.reduce(
    (sum, payment) => sum + payment.cash,
    0
  );
  const splitPaymentCardTotal = splitPayments.reduce(
    (sum, payment) => sum + payment.card,
    0
  );

  // Calcola il totale pagato
  const totalPayment =
    directPayment + splitPaymentCashTotal + splitPaymentCardTotal;

  useEffect(() => {
    setChange(Math.max(totalPayment - total, 0));
  }, [totalPayment, total]);

  const handleConfirmPayment = () => {
    if (totalPayment >= total) {
      onConfirmPayment(
        (parseFloat(cashReceived) || 0) + splitPaymentCashTotal,
        (parseFloat(cardPayment) || 0) + splitPaymentCardTotal
      );
    } else {
      alert("L'importo pagato non è sufficiente.");
    }
  };

  const handleFocus = (e, setValue, otherValue) => {
    if (!firstFieldFocused) {
      setFirstFieldFocused(true);
      e.target.value = total.toFixed(2);
      setValue(e.target.value);
    }
    e.target.select();
  };

  const handleOpenSplitPayment = () => {
    setIsSplitPayment(true);
  };

  const handleCloseSplitPayment = () => {
    setIsSplitPayment(false);
  };

  // Aggiorna gli split payments con l'importo destinato agli articoli
  const handleAddSplitPayment = (payment) => {
    setSplitPayments((prevPayments) => [...prevPayments, payment]);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-xl">
          {/* Header */}
          <div className="px-4 py-3 border-b">
            <h2 className="text-2xl font-bold text-gray-800">
              Pagamento - Tavolo {tableName}
            </h2>
          </div>

          {/* Dettagli Ordine */}
          <div className="px-4 py-3 max-h-[60vh] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Articolo
                  </th>
                  <th className="px-2 py-2 text-right text-sm font-bold text-gray-700 uppercase tracking-wider w-20">
                    Qt.
                  </th>
                  <th className="px-2 py-2 text-right text-sm font-bold text-gray-700 uppercase tracking-wider w-24">
                    Prezzo
                  </th>
                  <th className="px-2 py-2 text-right text-sm font-bold text-gray-700 uppercase tracking-wider w-24">
                    Totale
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.map((item, index) => (
                  <tr key={index}>
                    <td className="px-2 py-2 text-base font-semibold text-gray-900 break-words">
                      {item.name}
                    </td>
                    <td className="px-2 py-2 text-base font-semibold text-right text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-2 py-2 text-base font-semibold text-right text-gray-900">
                      €{item.price.toFixed(2)}
                    </td>
                    <td className="px-2 py-2 text-base font-semibold text-right text-gray-900">
                      €{(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totale e Pagamenti */}
          <div className="px-4 py-3 bg-gray-50 border-t">
            <div className="mb-4">
              <span className="text-xl font-bold text-gray-800">
                Totale da pagare: €{total.toFixed(2)}
              </span>
            </div>
            <div className="mb-4">
              <label className="block text-lg font-semibold text-gray-700">
                Contanti ricevuti:
              </label>
              <input
                type="text"
                value={(parseFloat(cashReceived) || 0) + splitPaymentCashTotal}
                onChange={(e) => setCashReceived(e.target.value)}
                onFocus={(e) => handleFocus(e, setCashReceived, cardPayment)}
                className="mt-1 block w-full text-lg font-semibold border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-lg font-semibold text-gray-700">
                Pagamento con carta:
              </label>
              <input
                type="text"
                value={(parseFloat(cardPayment) || 0) + splitPaymentCardTotal}
                onChange={(e) => setCardPayment(e.target.value)}
                onFocus={(e) => handleFocus(e, setCardPayment, cashReceived)}
                className="mt-1 block w-full text-lg font-semibold border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="mb-4 text-xl font-bold text-gray-800">
              Resto: €{change.toFixed(2)}
            </div>

            {/* Pulsanti di Azione */}
            <div className="flex justify-end space-x-2 mt-4">
              <button
                className="px-4 py-2 text-lg font-semibold bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                onClick={handleOpenSplitPayment}
              >
                Paga Separatamente
              </button>
            </div>

            {/* Bottoni Conferma e Annulla */}
            <div className="flex justify-end space-x-2 mt-4">
              <button
                className="px-4 py-2 text-lg font-semibold bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                onClick={onClose}
              >
                Annulla
              </button>
              <button
                className="px-4 py-2 text-lg font-semibold bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                onClick={handleConfirmPayment}
              >
                Conferma Pagamento
              </button>
            </div>
          </div>

          {/* Finestra di Pagamento Separato */}
          {isSplitPayment && (
            <SplitPaymentView
              order={order}
              total={total}
              onClose={handleCloseSplitPayment}
              onAddSplitPayment={handleAddSplitPayment}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentView;
