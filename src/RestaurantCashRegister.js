import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "./supabaseClient";
import TableManagementView from "./TableManagementView";
import MenuManagementView from "./MenuManagementView";
import PaymentView from "./PaymentView";
import ReceiptViewer from "./ReceiptViewer";
import printJS from "print-js";

const RestaurantCashRegister = () => {
  const [activeSection, setActiveSection] = useState("tables"); // 'tables', 'menu', 'orders'
  const [autosaveMessage, setAutosaveMessage] = useState(false);
  const inactivityTimerRef = useRef(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const { t, i18n } = useTranslation();
  const [showInfoMessage, setShowInfoMessage] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [selectedTable, setSelectedTable] = useState(null);
  const [orders, setOrders] = useState({});
  const [showTableManagement, setShowTableManagement] = useState(false);
  const [showMenuManagement, setShowMenuManagement] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceiptViewer, setShowReceiptViewer] = useState(false);
  const [tables, setTables] = useState([]);
  const [menu, setMenu] = useState({});
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [hasOpenTables, setHasOpenTables] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [filterDestination, setFilterDestination] = useState("all");
  const [showRefund, setShowRefund] = useState(false);
  const [showCashControlModal, setShowCashControlModal] = useState(false);
  const [cashControlTotals, setCashControlTotals] = useState({
    cash: 0,
    card: 0,
    total: 0,
    refunds: 0,
  });
  const [showCurrentOrderModal, setShowCurrentOrderModal] = useState(false);
  const checkIfAnyModalOpen = () => {
    return (
      showPayment ||
      showReceiptViewer ||
      showCurrentOrderModal ||
      showEndSessionModal ||
      showRefund
    );
  };
  // Stati aggiunti per la modifica dell'info tavolo
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [newTableInfo, setNewTableInfo] = useState("");
  const handleShowReceiptViewer = () => {
    setShowReceiptViewer(true);
  };
  // Riferimenti per mantenere lo stato aggiornato all'interno di setTimeout
  const selectedTableRef = useRef(selectedTable);
  const isEditingOrderRef = useRef(isEditingOrder);

  // Aggiorna i riferimenti ogni volta che lo stato cambia
  useEffect(() => {
    selectedTableRef.current = selectedTable;
  }, [selectedTable]);

  useEffect(() => {
    isEditingOrderRef.current = isEditingOrder;
  }, [isEditingOrder]);

  // Funzione per mostrare messaggi
  const showMessage = (message) => {
    setInfoMessage(message);
    setShowInfoMessage(true);
    setTimeout(() => setShowInfoMessage(false), 3000);
  };

  // Funzione per resettare il timer di inattività
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      console.log("Timer precedente cancellato.");
    }

    inactivityTimerRef.current = setTimeout(() => {
      // Mostra il messaggio di AUTOSAVE
      setAutosaveMessage(true);
      console.log("AUTOSAVE in corso...");

      // Dopo 3 secondi, conferma automaticamente l'ordine
      setTimeout(() => {
        setAutosaveMessage(false);
        handleConfirmOrder();
        console.log("Ordine confermato.");
      }, 3000);
    }, 30000); // 30 secondi di inattività

    console.log("Nuovo timer impostato per 15 minuti.");
  };

  // Funzione per confermare l'ordine automaticamente
  const handleConfirmOrder = async () => {
    const currentSelectedTable = selectedTableRef.current;
    const currentIsEditingOrder = isEditingOrderRef.current;

    if (currentSelectedTable) {
      if (orders[currentSelectedTable]?.length > 0) {
        try {
          console.log("Salvataggio dell'ordine nel database...");
          await saveOrderToDatabase(
            currentSelectedTable,
            orders[currentSelectedTable]
          );
          console.log("Ordine salvato con successo.");

          showMessage("Ordine confermato.");
          console.log("Messaggio AUTOSAVE mostrato.");
        } catch (error) {
          console.error("Errore nella conferma dell'ordine:", error);
          alert(
            "Si è verificato un errore nella conferma dell'ordine. Riprova."
          );
          return;
        }
      } else {
        showMessage("Ritorno al menu dei tavoli.");
        console.log("Nessun ordine da confermare. Reset dello stato.");
      }

      if (!checkIfAnyModalOpen()) {
        setIsEditingOrder(false);
        setSelectedTable(null);
        console.log(
          "Stato dell'ordine resettato. Ritornando al menu dei tavoli."
        );
      } else {
        console.log("Una modale è aperta. Non resettare lo stato dell'ordine.");
      }

      await fetchOrders();
      console.log("Ordini ricaricati.");
    } else {
      console.log("Nessun tavolo selezionato.");
    }
  };

  // Aggiungi questa nuova funzione
  const handleCancelOrder = () => {
    setIsEditingOrder(false);
    setSelectedTable(null);
    showMessage("Ordine annullato.");
    console.log("Ordine annullato. Ritorno al menu dei tavoli.");
  };

  // Aggiungi event listener per l'attività dell'utente
  useEffect(() => {
    const events = [
      "mousemove",
      "mousedown",
      "keypress",
      "touchstart",
      "scroll",
    ];

    const handleUserActivity = () => {
      if (isEditingOrder && !checkIfAnyModalOpen()) {
        resetInactivityTimer();
        console.log("Attività utente rilevata, timer resettato.");
      }
    };

    if (isEditingOrder && !checkIfAnyModalOpen()) {
      events.forEach((event) => {
        window.addEventListener(event, handleUserActivity);
      });
      resetInactivityTimer();
      console.log("Timer di inattività attivato.");
    } else {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        console.log("Timer di inattività disattivato.");
      }
    }

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [
    isEditingOrder,
    showPayment,
    showReceiptViewer,
    showCurrentOrderModal,
    showEndSessionModal,
    showRefund,
  ]);

  // Funzioni esistenti per il recupero dei dati e altre operazioni
  useEffect(() => {
    // Funzioni iniziali per il recupero dei dati
    checkActiveSession(); // Controlla se la sessione è attiva
    fetchTables(); // Recupera i dati dei tavoli
    fetchMenu(); // Recupera i dati del menu

    // Imposta intervalli per aggiornare le diverse entità
    const tavoliInterval = setInterval(fetchTables, 10000); // Aggiorna tavoli ogni 10 secondi
    const menuInterval = setInterval(fetchMenu, 60000); // Aggiorna menu ogni 60 secondi

    // Pulizia degli intervalli quando il componente viene smontato
    return () => {
      clearInterval(tavoliInterval);
      clearInterval(menuInterval);
    };
  }, []);

  useEffect(() => {
    checkOpenTables();
  }, [orders]);

  useEffect(() => {
    let ordiniInterval;

    if (!isEditingOrder) {
      fetchOrders(); // Esegui il fetch immediatamente quando non si sta modificando
      ordiniInterval = setInterval(fetchOrders, 5000); // Aggiorna ordini ogni 5 secondi
    }

    return () => {
      if (ordiniInterval) clearInterval(ordiniInterval);
    };
  }, [isEditingOrder]);

  // Funzioni per interagire con il database
  const checkActiveSession = async () => {
    const { data, error } = await supabase
      .from("cash_sessions")
      .select("*")
      .is("end_time", null)
      .order("start_time", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error checking active session:", error);
    } else if (data && data.length > 0) {
      setIsSessionActive(true);
      setCurrentSessionId(data[0].id);
    } else {
      setIsSessionActive(false);
      setCurrentSessionId(null);
    }
  };

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .order("id");
      if (error) throw error;
      setTables(data.map((table) => ({ name: table.name, info: table.notes })));
    } catch (error) {
      console.error("Error fetching tables:", error);
      alert("Si è verificato un errore nel caricamento dei tavoli. Riprova.");
    }
  };

  const fetchMenu = async () => {
    try {
      const { data, error } = await supabase.from("menu").select("*");
      if (error) throw error;

      const menuObj = data.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push({
          name: item.name,
          price: parseFloat(item.price),
          destinazione: item.destinazione,
        });
        return acc;
      }, {});

      setMenu(menuObj);
    } catch (error) {
      console.error("Error fetching menu:", error);
      alert("Si è verificato un errore nel caricamento del menu. Riprova.");
    }
  };

  const fetchOrders = async () => {
    if (isEditingOrder) {
      // Non eseguire il fetch se si sta modificando un ordine
      return;
    }
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .or("payment_status.is.null,payment_status.neq.paid");

      if (error) throw error;

      const ordersObj = data.reduce((acc, order) => {
        if (!acc[order.table_id]) {
          acc[order.table_id] = [];
        }

        const items = JSON.parse(order.items).map((item) => ({
          ...item,
          id: item.id || `${order.table_id}_${item.name}`,
        }));

        acc[order.table_id] = items;

        return acc;
      }, {});

      setOrders(ordersObj);
      checkOpenTables();
    } catch (error) {
      console.error("Error fetching orders:", error);
      alert("Si è verificato un errore nel caricamento degli ordini. Riprova.");
    }
  };

  const checkOpenTables = () => {
    const openTables = Object.entries(orders).some(
      ([tableId, tableOrders]) =>
        tableOrders &&
        tableOrders.length > 0 &&
        tableOrders.some((order) => order.payment_status !== "paid")
    );
    setHasOpenTables(openTables);
  };

  const getOrCreateOrderId = async (tableId) => {
    const { data, error } = await supabase
      .from("orders")
      .select("order_id")
      .eq("table_id", tableId)
      .is("payment_status", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching order_id:", error);
      throw error;
    }

    if (data && data.length > 0) {
      return data[0].order_id;
    } else {
      return `${tableId}_${Date.now()}`;
    }
  };

  const saveOrderToDatabase = async (tableId, tableOrders) => {
    try {
      const order_id = await getOrCreateOrderId(tableId);
      const currentTime = new Date().toISOString();
      const tableInfo =
        tables.find((table) => table.name === tableId)?.info || "";

      await supabase.from("orders").upsert({
        table_id: tableId,
        items: JSON.stringify(tableOrders),
        created_at: currentTime,
        status: "active",
        order_id: order_id,
        payment_status: null,
        notes: tableInfo,
      });

      // Aggiorna lo stato locale dopo aver salvato nel database
      setOrders((prevOrders) => {
        const newOrders = { ...prevOrders };
        newOrders[tableId] = tableOrders;
        return newOrders;
      });
      checkOpenTables();
    } catch (error) {
      console.error("Errore nell'aggiornamento del database:", error);
      alert(
        t("Si è verificato un errore nell'aggiornamento dell'ordine. Riprova.")
      );
    }
  };

  const handleTableSelection = (tableName) => {
    setSelectedTable(tableName);
    setIsEditingOrder(true);
  };

  const handleOrderChange = async (
    category,
    item,
    increment,
    newPrice = null
  ) => {
    if (!isSessionActive) {
      alert(
        t(
          "La sessione di cassa non è attiva. Impossibile modificare gli ordini."
        )
      );
      return;
    }

    if (!selectedTable) {
      showMessage(
        "Per favore, seleziona un tavolo prima di aggiungere articoli."
      );
      return;
    }
    if (!isEditingOrder) {
      setIsEditingOrder(true);
    }
    if (selectedTable) {
      const updatedOrders = { ...orders };
      const tableOrders = updatedOrders[selectedTable]
        ? [...updatedOrders[selectedTable]]
        : [];
      const existingItemIndex = tableOrders.findIndex(
        (orderItem) => orderItem.name === item.name
      );

      if (existingItemIndex > -1) {
        const newQuantity = tableOrders[existingItemIndex].quantity + increment;
        if (newQuantity > 0) {
          tableOrders[existingItemIndex] = {
            ...tableOrders[existingItemIndex],
            quantity: newQuantity,
            price:
              newPrice !== null
                ? newPrice
                : tableOrders[existingItemIndex].price,
          };
        } else {
          tableOrders.splice(existingItemIndex, 1);
        }
      } else if (increment > 0) {
        tableOrders.push({
          ...item,
          quantity: increment,
          id: `${selectedTable}_${item.name}`,
          price: newPrice !== null ? newPrice : item.price,
        });
      }

      // Aggiorna immediatamente lo stato locale
      updatedOrders[selectedTable] = tableOrders;
      setOrders(updatedOrders);
      checkOpenTables();

      try {
        const order_id = await getOrCreateOrderId(selectedTable);
        const currentTime = new Date().toISOString();
        const tableInfo =
          tables.find((table) => table.name === selectedTable)?.info || "";

        await supabase.from("orders").upsert({
          table_id: selectedTable,
          items: JSON.stringify(tableOrders),
          created_at: currentTime,
          status: "active",
          order_id: order_id,
          payment_status: null,
          notes: tableInfo,
        });

        // Sincronizza lo stato dopo la risposta dal database
        setOrders((prevOrders) => {
          const newOrders = { ...prevOrders };
          newOrders[selectedTable] = tableOrders;
          return newOrders;
        });
        checkOpenTables();
      } catch (error) {
        console.error("Errore nell'aggiornamento del database:", error);
        alert(
          t(
            "Si è verificato un errore nell'aggiornamento dell'ordine. Riprova."
          )
        );
      }
    }
  };

  const handleUpdateMenu = async (updatedMenu) => {
    try {
      await supabase.from("menu").delete().not("id", "is", null);

      const menuItems = Object.entries(updatedMenu).flatMap(
        ([category, items]) =>
          items.map((item) => ({
            category,
            name: item.name,
            price: parseFloat(item.price),
            destinazione: item.destinazione,
          }))
      );

      await supabase.from("menu").insert(menuItems);

      setMenu(updatedMenu);
      console.log("Menu aggiornato con successo");
    } catch (error) {
      console.error("Errore durante l'aggiornamento del menu:", error);
      alert(
        "Si è verificato un errore durante l'aggiornamento del menu. Riprova."
      );
    }
  };

  const filteredOrders = (tableOrders) => {
    if (filterDestination === "all") return tableOrders;
    return tableOrders.filter((item) => {
      const menuItem = Object.values(menu)
        .flat()
        .find((menuItem) => menuItem.name === item.name);
      return menuItem && menuItem.destinazione === filterDestination;
    });
  };

  const handleUpdateTables = async (updatedTables) => {
    try {
      await supabase.from("tables").delete().not("id", "is", null);
      await supabase.from("tables").insert(
        updatedTables.map((table) => ({
          name: table.name,
          notes: table.info,
        }))
      );

      setTables(updatedTables);
      await fetchTables();

      const updatedOrders = { ...orders };
      Object.keys(updatedOrders).forEach((table) => {
        if (!updatedTables.some((t) => t.name === table)) {
          delete updatedOrders[table];
        }
      });
      setOrders(updatedOrders);
      if (
        selectedTable &&
        !updatedTables.some((t) => t.name === selectedTable)
      ) {
        setSelectedTable(null);
      }
      checkOpenTables();
    } catch (error) {
      console.error("Error updating tables:", error);
      alert(
        "Si è verificato un errore nell'aggiornamento dei tavoli. Riprova."
      );
    }
  };

  const handlePayment = () => {
    if (!isSessionActive) {
      alert(
        "La sessione di cassa non è attiva. Impossibile effettuare pagamenti."
      );
      return;
    }

    if (!selectedTable) {
      showMessage(
        "Per favore, seleziona un tavolo prima di procedere al pagamento."
      );
      return;
    }

    if (selectedTable && orders[selectedTable]?.length > 0) {
      setShowPayment(true);
    } else {
      showMessage("Non ci sono ordini per questo tavolo.");
    }
  };

  const handleConfirmPayment = async (cashReceived, cardPayment) => {
    if (selectedTable && orders[selectedTable]?.length > 0) {
      const totalAmount = orders[selectedTable].reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const changeAmount = Math.max(
        cashReceived + cardPayment - totalAmount,
        0
      );

      try {
        const order_id = await getOrCreateOrderId(selectedTable);

        await supabase.from("payments").insert({
          table_id: selectedTable,
          total_amount: totalAmount,
          cash_amount: cashReceived,
          card_amount: cardPayment,
          change_amount: changeAmount,
          items: JSON.stringify(orders[selectedTable] || []),
          created_at: new Date().toISOString(),
          server_name: "Default Server",
          notes: "",
        });

        await supabase
          .from("orders")
          .update({ payment_status: "paid" })
          .eq("table_id", selectedTable)
          .eq("order_id", order_id)
          .is("payment_status", null);

        setOrders((prevOrders) => {
          const newOrders = { ...prevOrders };
          delete newOrders[selectedTable];
          return newOrders;
        });

        setShowPayment(false);
        setSelectedTable(null);
        setIsEditingOrder(false); // Resetta l'editing
        console.log("Pagamento registrato con successo");
      } catch (error) {
        console.error("Errore durante la registrazione del pagamento:", error);
        alert("Si è verificato un errore durante il pagamento. Riprova.");
      } finally {
        checkOpenTables();
        fetchOrders();
      }
    }
  };

  const selectTextOnFocus = (event) => {
    event.target.select();
  };

  const handleStartSession = async () => {
    try {
      const { data, error } = await supabase
        .from("cash_sessions")
        .insert({ start_time: new Date().toISOString() })
        .select();

      if (error) throw error;

      setIsSessionActive(true);
      setCurrentSessionId(data[0].id);
    } catch (error) {
      console.error("Error starting session:", error);
      alert("Errore nell'avvio della sessione. Riprova.");
    }
  };

  const handleEndSession = async () => {
    if (hasOpenTables) {
      alert(
        "Non è possibile chiudere la sessione. Ci sono ancora tavoli aperti."
      );
      return;
    }

    try {
      // Chiudi la sessione attuale
      await supabase
        .from("cash_sessions")
        .update({
          end_time: new Date().toISOString(),
          is_active: false,
        })
        .eq("id", currentSessionId);

      // Svuota i database orders e completed_orders
      await clearOrdersDatabase();

      // Aggiorna lo stato della sessione
      setIsSessionActive(false);
      setCurrentSessionId(null);
      alert("Sessione chiusa con successo.");
      await checkActiveSession();
      setOrders({});
    } catch (error) {
      console.error("Error ending session:", error);
      alert("Errore nella chiusura della sessione. Riprova.");
    }
  };

  const handleConfirmEndSession = () => {
    setShowEndSessionModal(false);
    handleEndSession();
  };

  const handleCashControl = async () => {
    try {
      const { data: lastSession } = await supabase
        .from("cash_sessions")
        .select("*")
        .order("start_time", { ascending: false })
        .limit(1)
        .single();

      const { data: paymentsData } = await supabase
        .from("payments")
        .select("cash_amount, card_amount, total_amount, change_amount")
        .gte("created_at", lastSession.start_time)
        .lte("created_at", lastSession.end_time || new Date().toISOString());

      const totals = paymentsData.reduce(
        (acc, payment) => ({
          cash:
            acc.cash +
            (payment.cash_amount || 0) -
            (payment.change_amount || 0),
          card: acc.card + (payment.card_amount || 0),
          total: acc.total + (payment.total_amount || 0),
          refunds:
            acc.refunds + (payment.total_amount < 0 ? payment.total_amount : 0), // Somma totale dei rimborsi
        }),
        { cash: 0, card: 0, total: 0, refunds: 0 }
      );

      totals.cash = totals.total - totals.card;

      const sessionStatus = lastSession.end_time
        ? "Sessione chiusa"
        : "Sessione ancora aperta";

      alert(
        `Incasso dell'ultima sessione:
Totale contanti: €${totals.cash.toFixed(2)}
Totale carta: €${totals.card.toFixed(2)}
Totale generale: €${totals.total.toFixed(2)}
Totale rimborsi: €${totals.refunds.toFixed(2)}` +
          (totals.refunds !== 0 ? ` (verifica dettaglio scontrini)` : "") + // Aggiungi descrizione in rosso
          `\nInizio sessione: ${new Date(
            lastSession.start_time
          ).toLocaleString()}
${
  lastSession.end_time
    ? `Fine sessione: ${new Date(lastSession.end_time).toLocaleString()}`
    : ""
}
${sessionStatus}`
      );

      await supabase
        .from("cash_sessions")
        .update({
          total_cash: totals.cash,
          total_card: totals.card,
          total_amount: totals.total,
        })
        .eq("id", lastSession.id);
    } catch (error) {
      console.error("Error in cash control:", error);
      alert("Si è verificato un errore durante il controllo cassa. Riprova.");
    }
  };

  const clearOrdersDatabase = async () => {
    try {
      const { error: ordersError } = await supabase
        .from("orders")
        .delete()
        .not("id", "is", null);
      if (ordersError)
        throw new Error(
          `Errore nello svuotamento di 'orders': ${ordersError.message}`
        );

      const { error: completedOrdersError } = await supabase
        .from("completed_orders")
        .delete()
        .not("id", "is", null);
      if (completedOrdersError)
        throw new Error(
          `Errore nello svuotamento di 'completed_orders': ${completedOrdersError.message}`
        );

      const { error: completedOrdersBarError } = await supabase
        .from("completed_orders_bar")
        .delete()
        .not("id", "is", null);
      if (completedOrdersBarError)
        throw new Error(
          `Errore nello svuotamento di 'completed_orders_bar': ${completedOrdersBarError.message}`
        );

      console.log(
        "Database 'orders', 'completed_orders' e 'completed_orders_bar' svuotati con successo"
      );
    } catch (error) {
      console.error("Errore nello svuotamento dei database:", error);
      alert(
        "Si è verificato un errore nello svuotamento dei database. Riprova."
      );
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const handleConfirmRefund = async (amount, description) => {
    try {
      await supabase.from("payments").insert({
        table_id: "N/A",
        total_amount: parseFloat(amount),
        cash_amount: parseFloat(amount),
        card_amount: 0,
        change_amount: 0,
        items: JSON.stringify([]),
        created_at: new Date().toISOString(),
        server_name: "Default Server",
        notes: description,
      });
      setShowRefund(false);
      alert("Rimborso registrato con successo.");
    } catch (error) {
      console.error("Errore durante il rimborso:", error);
      alert("Si è verificato un errore durante il rimborso. Riprova.");
    }
  };

  const handleShowCurrentOrder = () => {
    if (!selectedTable) {
      showMessage(
        "Per favore, seleziona un tavolo per visualizzare gli ordini in corso."
      );
      return;
    }

    if (!orders[selectedTable]?.length) {
      showMessage("Non ci sono ordini in corso per questo tavolo.");
      return;
    }

    setShowCurrentOrderModal(true);
  };

  const handleAddItem = (category, item) => {
    if (!selectedTable) {
      showMessage(
        "Per favore, seleziona un tavolo prima di aggiungere articoli."
      );
    } else {
      handleOrderChange(category, item, 1);
    }
  };

  const currentTable = tables.find((table) => table.name === selectedTable);

  // Definizione di isAnyModalOpen fuori dalle funzioni per poterlo usare in useEffect
  const isAnyModalOpen =
    showPayment ||
    showReceiptViewer ||
    showEndSessionModal ||
    showRefund ||
    showCurrentOrderModal;

  // useEffect per gestire il timer di inattività in base all'apertura delle modali
  useEffect(() => {
    if (isAnyModalOpen) {
      // Se una modale è aperta, cancella il timer di inattività
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        console.log("Timer cancellato perché una modale è aperta.");
      }
    } else {
      // Se nessuna modale è aperta, resetta il timer di inattività
      resetInactivityTimer();
      console.log("Timer resettato perché nessuna modale è aperta.");
    }

    // Cleanup in caso di cambio
    return () => {
      if (isAnyModalOpen && inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isAnyModalOpen]);

  // Funzione per salvare le modifiche all'info del tavolo
  const handleSaveTableInfo = async () => {
    if (!selectedTable) return;

    try {
      // Aggiorna le informazioni del tavolo nel database
      const { error } = await supabase
        .from("tables")
        .update({ notes: newTableInfo })
        .eq("name", selectedTable);

      if (error) {
        throw error;
      }

      // Aggiorna lo stato locale dei tavoli
      setTables((prevTables) =>
        prevTables.map((table) =>
          table.name === selectedTable
            ? { ...table, info: newTableInfo }
            : table
        )
      );

      // Esci dalla modalità di modifica
      setIsEditingInfo(false);

      // Mostra un messaggio di conferma
      showMessage("Informazioni tavolo aggiornate con successo.");
    } catch (error) {
      console.error("Errore nell'aggiornamento delle info del tavolo:", error);
      alert(
        "Si è verificato un errore nell'aggiornamento delle info del tavolo. Riprova."
      );
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-800">
      {/* Barra di navigazione per schermi piccoli - ora fissa */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-700">
        <div className="flex justify-between">
          {["tables", "menu", "orders"].map((section) => (
            <button
              key={section}
              className={`flex-1 py-2 ${
                activeSection === section ? "bg-blue-500" : "bg-gray-600"
              }`}
              onClick={() => setActiveSection(section)}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {isSessionActive ? (
        <>
          {/* Sezione Tavoli */}
          <div
            className={`w-full md:w-1/3 p-4 overflow-y-auto bg-gray-800 ${
              activeSection !== "tables" ? "hidden md:block" : ""
            }`}
          >
            <h2 className="text-2xl font-bold mb-4 text-white">Tavoli</h2>
            <div className="space-y-2">
              {!isEditingOrder ? (
                tables.map((table) => {
                  const tableTotal = orders[table.name]
                    ? orders[table.name]
                        .reduce(
                          (total, item) => total + item.price * item.quantity,
                          0
                        )
                        .toFixed(2)
                    : "0.00";

                  return (
                    <button
                      key={table.name}
                      className={`block w-full p-2 text-left rounded-lg shadow-md transform transition-transform duration-200 font-bold ${
                        selectedTable === table.name
                          ? "bg-yellow-500 text-white scale-105"
                          : orders[table.name]?.length > 0
                          ? "bg-red-500 text-white"
                          : "bg-green-500 text-white"
                      } hover:scale-105`}
                      onClick={() => {
                        setSelectedTable(table.name);
                        setIsEditingOrder(true);
                      }}
                      disabled={!isSessionActive}
                    >
                      <div className="flex justify-between items-center">
                        <span>
                          {table.name}
                          {table.info && (
                            <span className="ml-2 text-sm">({table.info})</span>
                          )}
                        </span>
                        <span className="text-lg">€{tableTotal}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-4 bg-blue-500 text-white rounded-lg shadow-md font-bold text-center">
                  <p>Stiamo servendo il tavolo: {selectedTable}</p>
                  {currentTable && (
                    <>
                      {isEditingInfo ? (
                        <div>
                          <input
                            type="text"
                            value={newTableInfo}
                            onChange={(e) => setNewTableInfo(e.target.value)}
                            className="bg-white text-black px-2 py-1 rounded w-full mb-2"
                            disabled={!isSessionActive}
                          />
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={handleSaveTableInfo}
                              className="bg-green-500 text-white px-4 py-2 rounded"
                              disabled={!isSessionActive}
                            >
                              Salva
                            </button>
                            <button
                              onClick={() => setIsEditingInfo(false)}
                              className="bg-gray-500 text-white px-4 py-2 rounded"
                            >
                              Annulla
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p>
                            {currentTable.info ||
                              "Nessuna informazione disponibile."}
                          </p>
                          <button
                            onClick={() => {
                              setIsEditingInfo(true);
                              setNewTableInfo(currentTable.info || "");
                            }}
                            className="bg-yellow-500 text-white px-4 py-2 rounded mt-2"
                            disabled={!isSessionActive}
                          >
                            Modifica Info
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Aggiunta del totale dell'ordine */}
                  <div className="mt-6">
                    <h3 className="text-2xl font-bold mb-2">Totale Ordine</h3>
                    <p className="text-4xl font-bold">
                      €
                      {orders[selectedTable]
                        ? orders[selectedTable]
                            .reduce(
                              (total, item) =>
                                total + item.price * item.quantity,
                              0
                            )
                            .toFixed(2)
                        : "0.00"}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {!isEditingOrder && (
              <button
                className="w-full p-2 bg-blue-500 text-white mt-4 rounded-lg hover:bg-blue-600 transition-colors font-bold"
                onClick={() => setShowTableManagement(true)}
                disabled={!isSessionActive || isEditingOrder}
              >
                Modifica Tavoli
              </button>
            )}
          </div>

          {/* Sezione Menu */}
          <div
            className={`w-full md:w-1/3 p-4 overflow-y-auto bg-gray-800 ${
              activeSection !== "menu" ? "hidden md:block" : ""
            }`}
          >
            <h2 className="text-2xl font-bold mb-4 text-white">{t("Menu")}</h2>
            {Object.entries(menu).map(([category, items]) => (
              <div key={category} className="mb-4">
                <button
                  className="w-full text-left font-bold text-xl bg-gray-700 text-white p-2 rounded-lg hover:bg-gray-600 transition-colors"
                  onClick={() => toggleCategory(category)}
                >
                  {category}
                </button>
                {expandedCategory === category && (
                  <div className="mt-2">
                    {items.map((item, index) => (
                      <div
                        key={`${category}-${item.name}-${index}`}
                        className="flex items-center mb-2 bg-blue-500 text-white p-2 rounded-lg shadow-md font-bold"
                      >
                        <button
                          className="bg-red-500 text-white w-8 h-8 rounded-full hover:bg-red-600 transition-colors font-bold"
                          onClick={() => handleOrderChange(category, item, -1)}
                          disabled={!isSessionActive}
                        >
                          -
                        </button>
                        <span className="mx-4">
                          {orders[selectedTable]?.find(
                            (orderItem) => orderItem.name === item.name
                          )?.quantity || 0}
                        </span>
                        <button
                          className="bg-green-500 text-white w-8 h-8 rounded-full hover:bg-green-600 transition-colors font-bold"
                          onClick={() => handleAddItem(category, item)}
                          disabled={!isSessionActive}
                        >
                          +
                        </button>
                        <span className="ml-4">
                          {item.name} - €{item.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <button
              className="w-full p-2 bg-blue-500 text-white mt-4 rounded-lg hover:bg-blue-600 transition-colors font-bold"
              onClick={() => setShowMenuManagement(true)}
              disabled={!isSessionActive}
            >
              Gestisci Menu
            </button>
          </div>
        </>
      ) : null}

      {/* Sezione Ordini */}

      <div
        className={`w-full md:w-1/3 p-4 flex flex-col bg-gray-800 ${
          activeSection !== "orders" ? "hidden md:block" : ""
        }`}
      >
        <div className="flex-grow overflow-y-auto">
          {/* Contenuto scrollabile della sezione Ordini */}
        </div>
        {/* Pulsanti di Azione - Visibili solo quando non ci sono modali aperte */}
        {!showPayment && !showCurrentOrderModal && (
          <div className="sticky top-0 bg-gray-800 z-10 pb-4">
            <h2 className="text-2xl font-bold mb-4 text-white">
              {t("Ordini")}
            </h2>
            <button
              className={`w-full p-2 text-white mb-2 rounded-lg font-bold ${
                isSessionActive && selectedTable
                  ? "bg-green-500 hover:bg-green-600 transition-colors"
                  : "bg-gray-400"
              }`}
              onClick={handleConfirmOrder}
              disabled={!isSessionActive || !selectedTable}
            >
              Conferma Ordine
            </button>
            <button
              className={`w-full p-2 text-white mb-2 rounded-lg font-bold ${
                isSessionActive
                  ? "bg-yellow-500 hover:bg-yellow-600 transition-colors"
                  : "bg-gray-400"
              }`}
              onClick={handleShowCurrentOrder}
              disabled={!isSessionActive}
            >
              Mostra Ordine Corrente
            </button>
            <button
              className={`w-full p-2 rounded-lg text-white mb-2 font-bold ${
                isSessionActive
                  ? "bg-green-500 hover:bg-green-600 transition-colors"
                  : "bg-gray-400"
              }`}
              onClick={handlePayment}
              disabled={!isSessionActive}
            >
              Paga e Libera Tavolo
            </button>
          </div>
        )}
        {/* Lista degli Ordini - Scrollabile */}
        <div className="flex-grow overflow-y-auto">
          {selectedTable && orders[selectedTable] && (
            <div>
              {filteredOrders(orders[selectedTable]).map((item, index) => (
                <div
                  key={index}
                  className="mb-4 bg-red-500 text-white p-2 rounded-lg shadow-lg font-bold"
                >
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => {
                      const updatedOrders = { ...orders };
                      const tableOrder = updatedOrders[selectedTable] || [];
                      const itemIndex = tableOrder.findIndex(
                        (orderItem) => orderItem.id === item.id
                      );
                      if (itemIndex > -1) {
                        tableOrder[itemIndex] = {
                          ...tableOrder[itemIndex],
                          name: e.target.value,
                        };
                        updatedOrders[selectedTable] = tableOrder;
                        setOrders(updatedOrders);
                        saveOrderToDatabase(selectedTable, tableOrder);
                      }
                    }}
                    className="bg-white text-black px-2 py-1 rounded w-full mb-2"
                    disabled={!isSessionActive}
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="mr-2">Qt.</span>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const quantity = parseInt(e.target.value) || 0;
                          handleOrderChange(
                            null,
                            item,
                            quantity - item.quantity
                          );
                        }}
                        min="1"
                        className="bg-white text-black px-2 py-1 rounded w-16"
                        disabled={!isSessionActive}
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">€</span>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => {
                          const price = parseFloat(e.target.value) || 0;
                          handleOrderChange(null, item, 0, price);
                        }}
                        step="0.01"
                        className="bg-white text-black px-2 py-1 rounded w-16"
                        disabled={!isSessionActive}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-4 font-bold text-white">
                Totale: €
                {orders[selectedTable]
                  .reduce(
                    (total, item) => total + item.price * item.quantity,
                    0
                  )
                  .toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* Altri pulsanti */}
        {!isEditingOrder && (
          <>
            <button
              className="w-full p-2 bg-purple-500 text-white mt-2 rounded-lg hover:bg-purple-600 transition-colors font-bold"
              onClick={() => setShowReceiptViewer(true)}
            >
              Visualizza Scontrini
            </button>
            <button
              className={`w-full p-2 rounded-lg text-white mt-2 font-bold ${
                !isSessionActive
                  ? "bg-green-500 hover:bg-green-600 transition-colors"
                  : "bg-gray-400"
              }`}
              onClick={handleStartSession}
              disabled={isSessionActive}
            >
              START
            </button>
            <button
              onClick={() => setShowEndSessionModal(true)}
              disabled={!isSessionActive || hasOpenTables}
              className={`w-full p-2 rounded-lg text-white mt-2 font-bold ${
                isSessionActive && !hasOpenTables
                  ? "bg-red-500 hover:bg-red-600 transition-colors"
                  : "bg-gray-400"
              }`}
            >
              END
            </button>
            <button
              onClick={handleCashControl}
              className="w-full p-2 bg-blue-500 text-white mt-2 rounded-lg hover:bg-blue-600 transition-colors font-bold"
            >
              Controllo Cassa
            </button>
            <button
              className={`w-full p-2 mt-2 rounded-lg font-bold ${
                isSessionActive
                  ? "bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                  : "bg-gray-400 text-gray-700"
              }`}
              onClick={() => setShowRefund(true)}
              disabled={!isSessionActive}
            >
              Rimborso
            </button>
          </>
        )}
      </div>

      {/* Modal e Messaggi */}
      {showTableManagement && (
        <TableManagementView
          tables={tables}
          onUpdateTables={handleUpdateTables}
          onClose={() => setShowTableManagement(false)}
        />
      )}

      {showInfoMessage && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white text-black px-6 py-3 rounded-lg shadow-lg text-lg font-bold border border-gray-300">
            {infoMessage}
          </div>
        </div>
      )}

      {showMenuManagement && (
        <MenuManagementView
          menu={menu}
          onUpdateMenu={handleUpdateMenu}
          onClose={() => setShowMenuManagement(false)}
        />
      )}

      {/* Messaggio di AUTOSAVE */}
      {autosaveMessage && (
        <div className="fixed top-0 left-0 w-full bg-yellow-500 text-white text-center py-2 z-50">
          AUTOSAVE in corso...
        </div>
      )}

      {showPayment && selectedTable && (
        <PaymentView
          order={orders[selectedTable] || []}
          tableName={selectedTable}
          onClose={() => setShowPayment(false)}
          onConfirmPayment={handleConfirmPayment}
        />
      )}

      {showReceiptViewer && (
        <ReceiptViewer onClose={() => setShowReceiptViewer(false)} />
      )}

      {showEndSessionModal && (
        <EndSessionModal
          onClose={() => setShowEndSessionModal(false)}
          onConfirm={handleConfirmEndSession}
        />
      )}

      {showRefund && (
        <RefundModal
          onClose={() => setShowRefund(false)}
          onConfirm={handleConfirmRefund}
        />
      )}

      {showCurrentOrderModal && selectedTable && (
        <CurrentOrderModal
          order={orders[selectedTable] || []}
          tableName={selectedTable}
          onClose={() => setShowCurrentOrderModal(false)}
        />
      )}
    </div>
  );
};

// Modal per confermare la chiusura della sessione
const EndSessionModal = ({ onClose, onConfirm }) => (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75">
    <div className="bg-white p-4 rounded shadow-md w-1/3">
      <h2 className="text-xl font-bold mb-4">Conferma Chiusura Cassa</h2>
      <p className="mb-4">
        Stai per chiudere la cassa. Tutte le operazioni e informazioni in corso
        saranno cancellate. Sei sicuro di voler procedere?
      </p>
      <div className="flex justify-end">
        <button
          className="mr-2 p-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors font-bold"
          onClick={onClose}
        >
          Annulla
        </button>
        <button
          className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-bold"
          onClick={onConfirm}
        >
          OK
        </button>
      </div>
    </div>
  </div>
);

// Modal per il rimborso
const RefundModal = ({ onClose, onConfirm }) => {
  const [refundAmount, setRefundAmount] = useState("");
  const [refundDescription, setRefundDescription] = useState("");

  const handleConfirm = () => {
    if (parseFloat(refundAmount) >= 0) {
      alert("Il valore del rimborso deve essere negativo.");
      return;
    }
    onConfirm(refundAmount, refundDescription);
  };

  const handleChangeAmount = (e) => {
    const value = -Math.abs(parseFloat(e.target.value) || 0);
    setRefundAmount(value);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-75">
      <div className="bg-white p-4 rounded shadow-md w-1/3">
        <h2 className="text-xl font-bold mb-4 text-black">Rimborso Cliente</h2>
        <div className="mb-4">
          <label className="block text-black">Importo:</label>
          <input
            type="number"
            value={refundAmount}
            onChange={handleChangeAmount}
            className="w-full p-2 border border-red-500 rounded"
            autoFocus
          />
        </div>
        <div className="mb-4">
          <label className="block text-black">Descrizione:</label>
          <input
            type="text"
            value={refundDescription}
            onChange={(e) => setRefundDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        <div className="flex justify-end">
          <button
            className="mr-2 p-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors font-bold"
            onClick={onClose}
          >
            Annulla
          </button>
          <button
            className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-bold"
            onClick={handleConfirm}
          >
            Conferma
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal per visualizzare l'ordine corrente
const CurrentOrderModal = ({ order, tableName, onClose }) => {
  const totalAmount = order.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-xl">
          <div className="px-4 py-3 border-b">
            <h2 className="text-xl font-bold text-gray-800">
              Ordine Corrente - Tavolo {tableName}
            </h2>
          </div>
          <div className="px-4 py-3 max-h-[60vh] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Articolo
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Qt.
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Prezzo
                  </th>
                  <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Totale
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.map((item, index) => (
                  <tr key={index}>
                    <td className="px-2 py-2 text-sm text-gray-900 break-words">
                      {item.name}
                    </td>
                    <td className="px-2 py-2 text-sm text-right text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-2 py-2 text-sm text-right text-gray-900">
                      €{item.price.toFixed(2)}
                    </td>
                    <td className="px-2 py-2 text-sm text-right text-gray-900">
                      €{(item.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-800">
                Totale: €{totalAmount.toFixed(2)}
              </span>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                onClick={onClose}
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

export default RestaurantCashRegister;
