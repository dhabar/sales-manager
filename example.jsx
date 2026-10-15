
import { useEffect, useState } from "react";
import {
  tablesDB,
  databaseId,
  customersTableId,
  transactionsTableId,
} from "./lib/appwrite";

function App() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Customer form
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Debt form
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [debtAmount, setDebtAmount] = useState("");
  const [debtNote, setDebtNote] = useState("");
  const [savingDebt, setSavingDebt] = useState(false);

  // Payment form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  // Load customers
  const getCustomers = async () => {
    try {
      setLoadingCustomers(true);

      const response = await tablesDB.listRows({
        databaseId,
        tableId: customersTableId,
      });

      setCustomers(response.rows);
    } catch (error) {
      console.error("Error loading customers:", error);
      alert(error.message || "Failed to load customers.");
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    getCustomers();
  }, []);

  // Load selected customer's transactions
  const getTransactions = async (customerId) => {
    try {
      setLoadingTransactions(true);

      const response = await tablesDB.listRows({
        databaseId,
        tableId: transactionsTableId,
      });

      const customerTransactions = response.rows
        .filter((transaction) => transaction.customerId === customerId)
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

      setTransactions(customerTransactions);
    } catch (error) {
      console.error("Error loading transactions:", error);
      alert(error.message || "Failed to load transactions.");
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Open customer account
  const openCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setTransactions([]);
    await getTransactions(customer.$id);
  };

  // Return to customer list
  const backToCustomers = () => {
    setSelectedCustomer(null);
    setTransactions([]);
    setShowDebtForm(false);
    setShowPaymentForm(false);
  };

  // Add customer
  const addCustomer = async (e) => {
    e.preventDefault();

    const name = customerName.trim();
    const phone = customerPhone.trim();

    if (!name) {
      alert("Enter the customer's name.");
      return;
    }

    try {
      setSavingCustomer(true);

      await tablesDB.createRow({
        databaseId,
        tableId: customersTableId,
        rowId: crypto.randomUUID(),
        data: {
          name,
          phone,
        },
      });

      setCustomerName("");
      setCustomerPhone("");
      setShowCustomerForm(false);

      await getCustomers();
      alert("Customer added successfully.");
    } catch (error) {
      console.error("Error adding customer:", error);
      alert(error.message || "Failed to add customer.");
    } finally {
      setSavingCustomer(false);
    }
  };

  // Add debt
  const addDebt = async (e) => {
    e.preventDefault();

    const amount = Number(debtAmount);

    if (!selectedCustomer) {
      alert("Select a customer first.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid debt amount.");
      return;
    }

    try {
      setSavingDebt(true);

      await tablesDB.createRow({
        databaseId,
        tableId: transactionsTableId,
        rowId: crypto.randomUUID(),
        data: {
          customerId: selectedCustomer.$id,
          type: "debt",
          amount,
          note: debtNote.trim(),
          date: new Date().toISOString(),
        },
      });

      await getTransactions(selectedCustomer.$id);

      setDebtAmount("");
      setDebtNote("");
      setShowDebtForm(false);
    } catch (error) {
      console.error("Error adding debt:", error);
      alert(error.message || "Failed to add debt.");
    } finally {
      setSavingDebt(false);
    }
  };

  // Record payment
  const addPayment = async (e) => {
    e.preventDefault();

    const amount = Number(paymentAmount);

    if (!selectedCustomer) {
      alert("Select a customer first.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid payment amount.");
      return;
    }

    try {
      setSavingPayment(true);

      await tablesDB.createRow({
        databaseId,
        tableId: transactionsTableId,
        rowId: crypto.randomUUID(),
        data: {
          customerId: selectedCustomer.$id,
          type: "payment",
          amount,
          note: paymentNote.trim(),
          date: new Date().toISOString(),
        },
      });

      await getTransactions(selectedCustomer.$id);

      setPaymentAmount("");
      setPaymentNote("");
      setShowPaymentForm(false);
    } catch (error) {
      console.error("Error recording payment:", error);
      alert(error.message || "Failed to record payment.");
    } finally {
      setSavingPayment(false);
    }
  };

  // Search customers by name
  const filteredCustomers = customers.filter((customer) =>
    (customer.name || "")
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  // Calculate balances
  const totalDebt = transactions
    .filter((transaction) => transaction.type === "debt")
    .reduce(
      (total, transaction) => total + Number(transaction.amount || 0),
      0
    );

  const totalPaid = transactions
    .filter((transaction) => transaction.type === "payment")
    .reduce(
      (total, transaction) => total + Number(transaction.amount || 0),
      0
    );

  const balance = totalDebt - totalPaid;

  const money = (amount) =>
    `$${Number(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // CUSTOMER ACCOUNT
  if (selectedCustomer) {
    return (
      <main style={styles.container}>
        <button style={styles.secondaryButton} onClick={backToCustomers}>
          ← Back to customers
        </button>

        <h1>{selectedCustomer.name}</h1>
        <p>Phone: {selectedCustomer.phone || "Not provided"}</p>

        <section style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <p>Total debt</p>
            <h2>{money(totalDebt)}</h2>
          </div>

          <div style={styles.summaryCard}>
            <p>Total paid</p>
            <h2>{money(totalPaid)}</h2>
          </div>

          <div style={styles.summaryCard}>
            <p>Current balance</p>
            <h2>{money(Math.abs(balance))}</h2>
            <strong>
              {balance > 0
                ? "deyn"
                : balance < 0
                ? "baaqi"
                : "zero balance"}
            </strong>
          </div>
        </section>

        <section style={styles.actions}>
          <button
            style={styles.primaryButton}
            onClick={() => {
              setShowDebtForm(!showDebtForm);
              setShowPaymentForm(false);
            }}
          >
            + Add Debt
          </button>

          <button
            style={styles.paymentButton}
            onClick={() => {
              setShowPaymentForm(!showPaymentForm);
              setShowDebtForm(false);
            }}
          >
            + Record Payment
          </button>
        </section>

        {showDebtForm && (
          <form onSubmit={addDebt} style={styles.form}>
            <h2>Add Debt</h2>

            <label>Amount</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Enter debt amount"
              value={debtAmount}
              onChange={(e) => setDebtAmount(e.target.value)}
              required
            />

            <label>Note (optional)</label>
            <input
              type="text"
              placeholder="What was the debt for?"
              value={debtNote}
              onChange={(e) => setDebtNote(e.target.value)}
            />

            <button
              type="submit"
              style={styles.primaryButton}
              disabled={savingDebt}
            >
              {savingDebt ? "Saving..." : "Save Debt"}
            </button>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => setShowDebtForm(false)}
            >
              Cancel
            </button>
          </form>
        )}

        {showPaymentForm && (
          <form onSubmit={addPayment} style={styles.form}>
            <h2>Record Payment</h2>

            <label>Amount received</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Enter payment amount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              required
            />

            <label>Note (optional)</label>
            <input
              type="text"
              placeholder="Payment details"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
            />

            <button
              type="submit"
              style={styles.paymentButton}
              disabled={savingPayment}
            >
              {savingPayment ? "Saving..." : "Save Payment"}
            </button>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => setShowPaymentForm(false)}
            >
              Cancel
            </button>
          </form>
        )}

        <section>
          <h2>Transaction History</h2>

          {loadingTransactions ? (
            <p>Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p>No transactions yet.</p>
          ) : (
            transactions.map((transaction) => (
              <article key={transaction.$id} style={styles.transaction}>
                <div>
                  <strong>
                    {transaction.type === "debt" ? "Debt added" : "Payment"}
                  </strong>

                  <p>{transaction.note || "No note"}</p>

                  <small>
                    {transaction.date
                      ? new Date(transaction.date).toLocaleString()
                      : "Date unavailable"}
                  </small>
                </div>

                <strong
                  style={{
                    color:
                      transaction.type === "debt" ? "#b91c1c" : "#15803d",
                  }}
                >
                  {transaction.type === "debt" ? "+" : "−"}
                  {money(transaction.amount)}
                </strong>
              </article>
            ))
          )}
        </section>
      </main>
    );
  }

  // CUSTOMER LIST
  return (
    <main style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1>Sales Manager</h1>
          <p>Manage customers, debts, and payments.</p>
        </div>

        <button
          style={styles.primaryButton}
          onClick={() => setShowCustomerForm(!showCustomerForm)}
        >
          + Add Customer
        </button>
      </header>

      {showCustomerForm && (
        <form onSubmit={addCustomer} style={styles.form}>
          <h2>New Customer</h2>

          <label>Customer name</label>
          <input
            type="text"
            placeholder="Enter customer name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />

          <label>Phone number (optional)</label>
          <input
            type="tel"
            placeholder="Enter phone number"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />

          <button
            type="submit"
            style={styles.primaryButton}
            disabled={savingCustomer}
          >
            {savingCustomer ? "Saving..." : "Save Customer"}
          </button>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => setShowCustomerForm(false)}
          >
            Cancel
          </button>
        </form>
      )}

      <input
        style={styles.search}
        type="search"
        placeholder="Search customer by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loadingCustomers ? (
        <p>Loading customers...</p>
      ) : filteredCustomers.length === 0 ? (
        <p>No customers found.</p>
      ) : (
        <section style={styles.customerList}>
          {filteredCustomers.map((customer) => (
            <button
              type="button"
              key={customer.$id}
              onClick={() => openCustomer(customer)}
              style={styles.customerCard}
            >
              <span>
                <strong>{customer.name}</strong>
                <small>{customer.phone || "No phone number"}</small>
              </span>
              <span>View account →</span>
            </button>
          ))}
        </section>
      )}
    </main>
  );
}

const styles = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
    color: "#000408",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "24px",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    margin: "24px 0",
  },
  summaryCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "16px",
    background: "#1a7be2f6",
  },
  actions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    margin: "20px 0",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "20px",
    margin: "20px 0",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
  },
  search: {
    width: "100%",
    boxSizing: "border-box",
    margin: "12px 0",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
  },
  customerList: {
    display: "grid",
    gap: "10px",
  },
  customerCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    width: "100%",
    padding: "16px",
    textAlign: "left",
    cursor: "pointer",
    background: "#c91919",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
  },
  transaction: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    padding: "16px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  primaryButton: {
    padding: "10px 16px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
  },
  paymentButton: {
    padding: "10px 16px",
    background: "#15803d",
    color: "#ffffff",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "10px 16px",
    background: "#f3f4f6",
    color: "#111827",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    cursor: "pointer",
  },
};

export default App;
