import {
  auth,
  db,
  collection,
  getDocs,
  onAuthStateChanged
} from "./firebase.js";
const ADMIN_EMAIL = "handmadecreations673@gmail.com";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  if (user.email !== ADMIN_EMAIL) {
    alert("Access denied! Admin only.");
    window.location.href = "index.html";
    return;
  }
  loadDashboard();
  });

async function loadDashboard() {
  const ordersSnapshot = await getDocs(collection(db, "orders"));
  const productsSnapshot = await getDocs(collection(db, "product"));
  const usersSnapshot = await getDocs(collection(db, "users"));

  // Dashboard cards
  document.getElementById("totalOrders").textContent = ordersSnapshot.size;
  document.getElementById("totalProducts").textContent = productsSnapshot.size;
  document.getElementById("totalCustomers").textContent = usersSnapshot.size;

  let totalSales = 0;
  const table = document.getElementById("ordersTable");
  table.innerHTML = "";

  ordersSnapshot.forEach(doc => {
    const order = doc.data();

    totalSales += Number(order.total || 0);

    const row = `
      <tr>
        <td style="padding:12px;">${doc.id}</td>
        <td style="padding:12px;">${order.customer?.fullName || "Guest"}</td>
        <td style="padding:12px;">${order.paymentMethod || "COD"}</td>
        <td style="padding:12px;">₹${order.total || 0}</td>
        <td style="padding:12px;color:green;">Completed</td>
      </tr>
    `;

    table.innerHTML += row;
  });

  document.getElementById("totalSales").textContent =
    `₹${totalSales}`;
}
