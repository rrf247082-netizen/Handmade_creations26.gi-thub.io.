import {
  auth,
  db,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onAuthStateChanged,
  serverTimestamp,
} from "./firebase.js";
const CLOUD_NAME = "jqdgffjk";
const UPLOAD_PRESET = "handmade_upload";

const ADMIN_EMAIL = "handmadecreations673@gmail.com";
const productFile = document.getElementById("productFile");

if (productFile) {

productFile.addEventListener("change", async (e) => {

const file = e.target.files[0];

if (!file) return;

const preview = document.getElementById("imagePreview");

preview.style.display = "block";

preview.src = URL.createObjectURL(file);

const formData = new FormData();

formData.append("file", file);

formData.append("upload_preset", UPLOAD_PRESET);

try {

const response = await fetch(
`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
{
method: "POST",
body: formData
}
);

const data = await response.json();

document.getElementById("productImage").value = data.secure_url;

alert("✅ Image uploaded successfully!");

} catch (err) {

console.error(err);

alert("❌ Image upload failed!");

}

});

}

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
        <td>
<select onchange="window.updateOrderStatus('${orderDoc.id}', this.value)">
<option value="Pending" ${order.status==="Pending"?"selected":""}>Pending</option>
<option value="Confirmed" ${order.status==="Confirmed"?"selected":""}>Confirmed</option>
<option value="Packed" ${order.status==="Packed"?"selected":""}>Packed</option>
<option value="Shipped" ${order.status==="Shipped"?"selected":""}>Shipped</option>
<option value="Delivered" ${order.status==="Delivered"?"selected":""}>Delivered</option>
</select>
</td>
<td>
<input
type="text"
placeholder="Tracking No."
value="${order.trackingNumber || ''}"
style="width:140px"
onchange="window.updateTrackingNumber('${orderDoc.id}', this.value)">
</td>
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
  const category = document.getElementById("productCategory").value;

  if (!name || !price || !image) {
    alert("Please fill all fields.");
    return;
  }

  try {

    await addDoc(collection(db, "product"), {
      name,
      category,
      price,
      image,
      createdAt: serverTimestamp(),
    });

    alert("✅ Product added successfully!");

    document.getElementById("productName").value = "";
    document.getElementById("productPrice").value = "";
    document.getElementById("productImage").value = "";
    document.getElementById("productCategory").value = "";

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
    
      table.innerHTML += `
        <tr>

          <td style="padding:10px;">
            <img src="${product.image}" width="60">
          </td>

          <td>
  <b>${product.name}</b><br>
  <small>${product.category || "No Category"}</small>
</td>

          <td>₹${product.price}</td>

          <td>
            <button onclick="window.editProduct('${id}')">
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
   }
window.editProduct = async function(id) {

  const productDoc = (await getDocs(collection(db, "product")))
  .docs.find(d => d.id === id);

if (!productDoc) return;

const product = productDoc.data();

const newName = prompt("Enter new product name:", product.name);
  if (newName === null) return;

  const newPrice = prompt("Enter new price:", product.price);
  if (newPrice === null) return;

  const newImage = prompt("Enter new image URL:", product.image);
  if (newImage === null) return;

  try {
    await updateDoc(doc(db, "product", id), {
      name: newName,
      price: Number(newPrice),
      image: newImage
    });

    alert("✅ Product updated successfully!");
    
    await loadDashboard();
    await loadProductsTable();

  } catch (error) {
    console.error(error);
    alert("❌ Failed to update product.");
  }
    };

window.updateOrderStatus = async function(id, status) {

  try {

    await updateDoc(doc(db, "orders", id), {
      status: status
    });
    if (status === "Shipped") {
  const orderDoc = (await getDocs(collection(db, "orders")))
    .docs.find(d => d.id === id);

  if (orderDoc) {
    const order = orderDoc.data();
    console.log(order);

    await emailjs.send(
      "service_nww5j5q",
      "template_2tn5kux",
      {
        email: order.customer.email,
        name: order.customer.fullName,
        order_id: id,
        tracking_number: order.trackingNumber || "Will be updated soon"
      }
    );
  }
    }
    console.log("Shipping email sent!");

    alert("✅ Order status updated!");

    loadDashboard();

  } catch (error) {

    console.error(error);

    alert("❌ Failed to update order status.");

  }

};
  
window.updateTrackingNumber = async function(id, trackingNumber) {

  try {

    await updateDoc(doc(db, "orders", id), {
      trackingNumber: trackingNumber,
status: trackingNumber.trim() ? "Shipped" : "Pending"
    });

    alert("✅ Tracking number saved!");

    loadDashboard();

  } catch (error) {

    console.error(error);

    alert("❌ Failed to save tracking number.");

  }

};
