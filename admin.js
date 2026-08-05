import {
  auth,
  db,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  onAuthStateChanged,
  serverTimestamp,
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
  loadProductsTable();
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
document.getElementById("addProductBtn").addEventListener("click", async () => {
    const name = document.getElementById("productName").value.trim();
    const price = Number(document.getElementById("productPrice").value);
    const image = document.getElementById("productImage").value.trim();

    if (!name || !price || !image) {
        alert("Please fill all fields.");
        return;
    }

    try {
        await addDoc(collection(db, "product"), {
            name,
            price,
            image,
            createdAt: serverTimestamp()
        });

        alert("✅ Product added successfully!");

        document.getElementById("productName").value = "";
        document.getElementById("productPrice").value = "";
        document.getElementById("productImage").value = "";

        loadDashboard();
      loadProductsTable();
      window.deleteProduct = async function(id) {
    if (!confirm("Delete this product?")) return;

    try {
        await deleteDoc(doc(db, "product", id));

        alert("✅ Product deleted!");

        loadDashboard();
        loadProductsTable();

    } catch (error) {
        console.error(error);
        alert("❌ Failed to delete product.");
    }
};
    } catch (error) {
        console.error(error);
        alert("❌ Failed to add product.");
    }
});
async function loadProductsTable() {
    const table = document.getElementById("productsTable");
    if (!table) return;

    table.innerHTML = "";

    const snapshot = await getDocs(collection(db, "product"));

    snapshot.forEach((docSnap) => {
        const product = docSnap.data();
        const id = docSnap. id;

        table.innerHTML += `
        <tr>
            <td style="padding:10px;">
                <img src="${product.image}" width="60">
            </td>

            <td>${product.name}</td>

            <td>₹${product.price}</td>

            <td>
                <button>Edit</button>
                <button
                onclick="window.deleteProduct('$
                  {id}')">Delete</button>
            </td>
        </tr>
        `;
    });
}

