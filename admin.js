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

  document.getElementById("totalOrders").textContent =
    ordersSnapshot.size;

  document.getElementById("totalProducts").textContent =
    productsSnapshot.size;

  document.getElementById("totalCustomers").textContent =
    usersSnapshot.size;

  let totalSales = 0;

  const table = document.getElementById("ordersTable");
  table.innerHTML = "";

  ordersSnapshot.forEach((orderDoc) => {
    const order = orderDoc.data();

    totalSales += Number(order.total || 0);

    table.innerHTML += `
      <tr>
        <td>${orderDoc.id}</td>
        <td>${order.customer?.fullName || "Guest"}</td>
        <td>${order.paymentMethod || "COD"}</td>
        <td>₹${order.total || 0}</td>
        <td style="color:green;">Completed</td>
      </tr>
    `;
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
      createdAt: serverTimestamp(),
    });

    alert("✅ Product added successfully!");

    document.getElementById("productName").value = "";
    document.getElementById("productPrice").value = "";
    document.getElementById("productImage").value = "";

    await loadDashboard();
    await loadProductsTable();

  } catch (error) {
    console.error(error);
    alert("❌ Failed to add product.");
  }

});

async function loadProductsTable() {

  const table = document.getElementById("productsTable");

  if (!table) return;

  table.innerHTML = "";
    try {

    const snapshot = await getDocs(collection(db, "product"));

    snapshot.forEach((docSnap) => {
    const id = docSnap.id;
    const product = docSnap.data();
      const id = docSnap.id;

      table.innerHTML += `
        <tr>

          <td style="padding:10px;">
            <img src="${product.image}" width="60">
          </td>

          <td>${product.name}</td>

          <td>₹${product.price}</td>

          <td>
            <button onclick="alert('Edit feature coming next')">
              Edit
            </button>

            <button onclick="window.deleteProduct('${id}')">
              Delete
            </button>

          </td>

        </tr>
      `;

    });

  } catch (error) {

    console.error(error);

    table.innerHTML = `
      <tr>
        <td colspan="4">
          ${error.message}
        </td>
      </tr>
    `;

  }

}
  try {

    const snapshot = await getDocs(collection(db, "product"));

    snapshot.forEach((docSnap) => {

      const product = docSnap.data();
      const id = docSnap.id;

      table.innerHTML += `
        <tr>

          <td style="padding:10px;">
            <img src="${product.image}" width="60">
          </td>

          <td>${product.name}</td>

          <td>₹${product.price}</td>

          <td>
            <button onclick="alert('Edit feature coming next')">
              Edit
            </button>

            <button onclick="window.deleteProduct('${id}')">
              Delete
            </button>

          </td>

        </tr>
      `;

    });

  } catch (error) {

    console.error(error);

    table.innerHTML = `
      <tr>
        <td colspan="4">
          ${error.message}
        </td>
      </tr>
    `;

  }

}
window.deleteProduct = async function(id) {

  const ok = confirm("Delete this product?");

  if (!ok) return;

  try {

    await deleteDoc(doc(db, "product", id));

    alert("✅ Product deleted successfully!");

    await loadDashboard();
    await loadProductsTable();

  } catch (error) {

    console.error(error);

    alert("❌ Failed to delete product.");

  }

};
