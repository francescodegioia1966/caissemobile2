import React, { useState } from "react";
import { FaArrowLeft } from "react-icons/fa"; // Assicurati di avere react-icons installato

const TableManagementView = ({ tables, onUpdateTables, onClose }) => {
  const [editedTables, setEditedTables] = useState(tables);
  const [newTableName, setNewTableName] = useState("");
  const [newTableInfo, setNewTableInfo] = useState("");

  const handleAddTable = () => {
    if (newTableName.trim()) {
      const updatedTables = [
        ...editedTables,
        { name: newTableName.trim(), info: newTableInfo.trim() },
      ];
      updatedTables.sort((a, b) => a.name.localeCompare(b.name));
      setEditedTables(updatedTables);
      setNewTableName("");
      setNewTableInfo("");

      // Salva automaticamente le modifiche
      onUpdateTables(updatedTables);
    }
  };

  const handleRemoveTable = (index) => {
    const updatedTables = editedTables.filter((_, i) => i !== index);
    setEditedTables(updatedTables);
    onUpdateTables(updatedTables); // Salva anche dopo la rimozione
  };

  const handleUpdateTableInfo = (index, info) => {
    const updatedTables = [...editedTables];
    updatedTables[index].info = info;
    setEditedTables(updatedTables);
    onUpdateTables(updatedTables); // Salva automaticamente dopo l'aggiornamento
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
          {/* Header */}
          <div className="px-4 py-3 border-b">
            <h2 className="text-2xl font-bold text-gray-800">
              Modifica Tavoli
            </h2>
          </div>

          {/* Form per l'aggiunta di nuovi tavoli */}
          <div className="px-4 py-3">
            <div className="flex mb-4">
              <input
                type="text"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="Nome nuovo tavolo"
                className="flex-grow px-3 py-2 border rounded mr-2"
              />
              <button
                onClick={handleAddTable}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors font-bold"
              >
                Aggiungi
              </button>
            </div>
            <input
              type="text"
              value={newTableInfo}
              onChange={(e) => setNewTableInfo(e.target.value)}
              placeholder="Info tavolo"
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          {/* Elenco dei tavoli */}
          <div className="px-4 py-3 max-h-[60vh] overflow-y-auto">
            {editedTables.map((table, index) => (
              <div
                key={index}
                className="flex items-center mb-2 bg-gray-100 p-2 rounded-lg shadow-md"
              >
                <span className="flex-grow px-2 py-1 font-bold text-gray-800">
                  {table.name}
                </span>
                <input
                  type="text"
                  value={table.info}
                  onChange={(e) => handleUpdateTableInfo(index, e.target.value)}
                  placeholder="Info"
                  className="ml-2 px-2 py-1 border rounded flex-grow"
                />
                <button
                  onClick={() => handleRemoveTable(index)}
                  className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-bold"
                >
                  X
                </button>
              </div>
            ))}
          </div>

          {/* Pulsante Annulla con freccia */}
          <div className="flex justify-end p-4 border-t bg-gray-300">
            <button
              onClick={onClose}
              className="flex items-center px-4 py-2 bg-gray-400 text-black rounded hover:bg-gray-500 transition-colors font-bold"
            >
              <FaArrowLeft className="mr-2" /> Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableManagementView;
