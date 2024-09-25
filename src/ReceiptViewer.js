import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const ReceiptViewer = ({ onClose }) => {
  const [receipts, setReceipts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching receipts:", error);
    } else {
      setReceipts(data);
      setCurrentIndex(0);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex < receipts.length - 1 ? prevIndex + 1 : 0
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : receipts.length - 1
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Data non disponibile";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Data non valida";
    return date.toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const parseItems = (itemsString) => {
    try {
      return JSON.parse(itemsString);
    } catch (error) {
      console.error("Error parsing items:", error);
      return [];
    }
  };

  const currentReceipt = receipts[currentIndex];

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-xl">
          <div className="px-4 py-3 border-b">
            <h2 className="text-2xl font-bold text-gray-800">
              {currentReceipt
                ? currentReceipt.total_amount < 0
                  ? "Scontrino di Rimborso"
                  : `Scontrino - Tavolo ${currentReceipt.table_id}`
                : "Visualizzazione Scontrini"}
            </h2>
          </div>
          <div className="px-4 py-3 max-h-[60vh] overflow-y-auto">
            {currentReceipt ? (
              <>
                <p className="mb-2 text-lg font-semibold">
                  Data: {formatDate(currentReceipt.created_at)}
                </p>
                {currentReceipt.total_amount < 0 && (
                  <p className="mb-2 text-lg font-semibold">
                    Note: {currentReceipt.notes}
                  </p>
                )}
                <table className="w-full mb-4">
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
                    {parseItems(currentReceipt.items).map((item, index) => (
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
                <div
                  className={`text-xl font-bold mt-2 ${
                    currentReceipt.total_amount < 0 ? "text-red-500" : ""
                  }`}
                >
                  Totale: €{currentReceipt.total_amount?.toFixed(2)}
                </div>
                <div
                  className={`text-lg font-semibold mt-2 ${
                    currentReceipt.cash_amount < 0 ? "text-red-500" : ""
                  }`}
                >
                  Contanti: €{currentReceipt.cash_amount?.toFixed(2)}
                </div>
                <div className="text-lg font-semibold mt-2">
                  Carta: €{currentReceipt.card_amount?.toFixed(2)}
                </div>
                <div className="text-lg font-semibold mt-2">
                  Resto: €{currentReceipt.change_amount?.toFixed(2)}
                </div>
              </>
            ) : (
              <p className="text-lg font-semibold">
                Nessuno scontrino disponibile
              </p>
            )}
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t">
            <div className="flex justify-between mb-4">
              <button
                onClick={handleNext}
                className="bg-green-500 text-white rounded-full p-2 w-12 h-12 flex items-center justify-center"
              >
                &lt;
              </button>
              <button
                onClick={handlePrevious}
                className="bg-green-500 text-white rounded-full p-2 w-12 h-12 flex items-center justify-center"
              >
                &gt;
              </button>
            </div>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptViewer;
