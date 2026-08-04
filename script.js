import {
  auth,
  db,
  collection,
  getDocs,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "./firebase.js";

(() => {
  // ----- Storage helpers -----
  const Storage = {
    get(key){ try { return JSON.parse(localStorage.getItem(key)) || null } catch { return null } },
    set(key, val){ localStorage.setItem(key, JSON.stringify(val)) },
    remove(key){ localStorage.removeItem(key) }
  };

  // ----- Simple UI helpers -----
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const formatPrice = n => Number(n || 0).toFixed(2);

  // ----- Cart API -----
  const Cart = {
    key: 'cart',
    list(){ return Storage.get(this.key) || [] },
    save(list){ Storage.set(this.key, list) },
    add(item){
      const list = this.list();
      // merge same item by name+price
      const idx = list.findIndex(i => i.name === item.name && Number(i.price) === Number(item.price));
      if(idx > -1){
        list[idx].qty = (Number(list[idx].qty) || 1) + (Number(item.qty) || 1);
      } else {
        list.push(Object.assign({qty:1, image:''}, item));
      }
      this.save(list);
    },
    updateQty(index, qty){
      const list = this.list();
      if(list[index]){ list[index].qty = Math.max(1, Number(qty)); this.save(list); }
    },
    remove(index){
      const list = this.list();
      if(list[index]){ list.splice(index,1); this.save(list); }
    },
    clear(){ this.save([]) }
  };

  // ----- Wishlist API -----
  const Wishlist = {
    key: 'wishlist',
    list(){ return Storage.get(this.key) || [] },
    save(list){ Storage.set(this.key, list) },
    add(item){
      const list = this.list();
      const exists = list.some(i => i.name === item.name && Number(i.price) === Number(item.price));
      if(!exists) { list.push(item); this.save(list); return true }
      return false;
    },
    remove(index){
      const list = this.list();
      if(list[index]){ list.splice(index,1); this.save(list); }
    }
  };

  // ----- Auth -----
  const Auth = {
    key: 'user',
    get(){ return Storage.get(this.key) },
    set(user){ Storage.set(this.key, user) },
    logout(){ Storage.remove(this.key) }
  };

  // ----- UI notifications -----
  function notify(msg){
    alert(msg);
  }

  // ----- Update user area in header -----
  function updateUserArea(){
    const userArea = $('#userArea');
    if(!userArea) return;
    
    onAuthStateChanged(auth, (user) => {
      if(user){
        userArea.innerHTML = `
          <span style="display:flex;gap:12px;align-items:center">
            <span style="color:var(--accent);font-size:14px">👤 ${user.displayName || user.email}</span>
            <button id="logoutBtn" class="btn btn-outline" style="padding:4px 12px;font-size:12px">Logout</button>
          </span>
        `;
        const logoutBtn = $('#logoutBtn');
        if(logoutBtn){
          logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
              Auth.logout();
              notify('Logged out');
              window.location.href = 'index.html';
            });
          });
        }
      } else {
        userArea.innerHTML = '<a href="login.html">👤 Login</a>';
      }
    });
  }

  // ----- Common page features -----
  function initHeaderActions(){
    updateUserArea();
  }

  // ----- Product / Shop page handlers (delegated) -----
  function initShopHandlers() {
    const root = document;
    root.addEventListener('click', (e) => {
      // Add to cart
      if(e.target.matches('.add-to-cart')){
        const card = e.target.closest('.product-card') || e.target.closest('[data-name]');
        if(!card) return;
        const name = card.dataset.name || card.getAttribute('data-name') || '';
        const price = Number((card.dataset.price || card.getAttribute('data-price') || 0));
        const image = card.dataset.image || card.getAttribute('data-image') || '';
        const item = { name, price, image, qty: 1 };
        Cart.add(item);
        notify('Added to cart');
        return;
      }

      // Add to wishlist
      if(e.target.matches('.add-wishlist')){
        const card = e.target.closest('.product-card') || e.target.closest('[data-name]');
        if(!card) return;
        const name = card.dataset.name || card.getAttribute('data-name') || '';
        const price = Number((card.dataset.price || card.getAttribute('data-price') || 0));
        const image = card.dataset.image || card.getAttribute('data-image') || '';
        const item = { name, price, image };
        const added = Wishlist.add(item);
        notify(added ? 'Added to wishlist' : 'Already in wishlist');
        return;
      }
    });

    // newsletter
    const newsletterForm = $('#newsletterForm');
    if(newsletterForm){
      newsletterForm.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const input = newsletterForm.querySelector('input[type="email"]');
        const email = input ? input.value.trim() : '';
        if(!email) return notify('Enter a valid email');
        Storage.set('newsletter_subscriber', { email, date: new Date().toISOString() });
        notify('Thanks for subscribing!');
        newsletterForm.reset();
      });
    }
  }

  // ----- Product detail page -----
  function initProductPage(){
    const productImage = $('#productImage');
    if(productImage){
      $$('.thumb').forEach(t => t.addEventListener('click', () => {
        if(t.src) productImage.src = t.src;
        else if(t.dataset && t.dataset.src) productImage.src = t.dataset.src;
      }));
    }

    const addToCartBtn = $('#addToCartBtn');
    if(addToCartBtn){
      addToCartBtn.addEventListener('click', () => {
        const nameEl = $('#productName');
        const priceEl = $('#productPrice');
        const qtyEl = $('#qty');
        const name = nameEl ? nameEl.innerText.trim() : '';
        const priceText = priceEl ? priceEl.innerText.replace('₹','').replace(/,/g,'').trim() : '0';
        const qty = qtyEl ? Number(qtyEl.value) || 1 : 1;
        const price = Number(priceText) || 0;
        Cart.add({ name, price, qty, image: productImage ? productImage.src : '' });
        notify('Item added to cart');
        window.location.href = 'cart.html';
      });
    }

    const addWishlistBtn = $('#addWishlistBtn');
    if(addWishlistBtn){
      addWishlistBtn.addEventListener('click', () => {
        const name = addWishlistBtn.dataset.name || ($('#productName') ? $('#productName').innerText : '') || '';
        const priceRaw = addWishlistBtn.dataset.price || ($('#productPrice') ? $('#productPrice').innerText.replace('₹','').replace(/,/g,'').trim() : '0');
        const image = addWishlistBtn.dataset.image || (productImage ? productImage.src : '');
        const price = Number(priceRaw) || 0;
        const item = { name, price, image };
        const added = Wishlist.add(item);
        notify(added ? 'Added to wishlist' : 'Already in wishlist');
      });
    }
  }

  // ----- Cart page rendering and actions -----
  function initCartPage(){
    const cartItemsEl = $('#cartItems');
    if(!cartItemsEl) return;

    const emptyEl = $('#emptyCart');
    const container = $('#cartContainer');
    const itemCountEl = $('#itemCount');
    const cartTotalEl = $('#cartTotal');
    const checkoutBtn = $('#checkoutBtn');
    const paymentMethodEl = $('#paymentMethod');

    function render(){
      const cart = Cart.list();
      cartItemsEl.innerHTML = '';
      if(!cart || cart.length === 0){
        if(emptyEl) emptyEl.style.display = 'block';
        if(container) container.style.display = 'none';
        if(itemCountEl) itemCountEl.innerText = 0;
        if(cartTotalEl) cartTotalEl.innerText = formatPrice(0);
        return;
      }
      if(emptyEl) emptyEl.style.display = 'none';
      if(container) container.style.display = 'grid';

      let total = 0;
      let itemsCount = 0;
      cart.forEach((item, idx) => {
        const price = Number(item.price) || 0;
        const qty = Number(item.qty) || 1;
        const subtotal = price * qty;
        total += subtotal;
        itemsCount += qty;

        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = `
          <div class="flex" style="gap:16px">
            <img src="${item.image || 'images/product1.jpg'}" alt="${item.name}" style="width:120px;height:100px;object-fit:cover;border-radius:10px">
            <div style="flex:1">
              <h3 style="margin:0 0 6px">${item.name}</h3>
              <p style="margin:0 0 6px;color:var(--accent);font-weight:700">₹${formatPrice(price)}</p>
              <div style="display:flex;gap:8px;align-items:center;margin-top:8px">
                <label style="font-size:14px">Qty</label>
                <input type="number" min="1" value="${qty}" data-index="${idx}" class="cart-qty" style="width:80px;padding:6px;border-radius:8px;border:1px solid #eee">
                <button class="btn btn-remove" data-index="${idx}" style="background:#ff4d4d">Remove</button>
              </div>
            </div>
            <div style="text-align:right">
              <p style="margin:0;color:#555">Subtotal</p>
              <p style="font-weight:700;font-size:18px;margin-top:6px">₹${formatPrice(subtotal)}</p>
            </div>
          </div>
        `;
        cartItemsEl.appendChild(el);
      });

      if(itemCountEl) itemCountEl.innerText = itemsCount;
      if(cartTotalEl) cartTotalEl.innerText = formatPrice(total);
    }

    // delegate remove/qty change
    document.addEventListener('click', (e) => {
      if(e.target.matches('.btn-remove')){
        const idx = Number(e.target.dataset.index);
        Cart.remove(idx);
        render();
      }
    });
    document.addEventListener('change', (e) => {
      if(e.target.matches('.cart-qty')){
        const idx = Number(e.target.dataset.index);
        const val = Math.max(1, Number(e.target.value) || 1);
        Cart.updateQty(idx, val);
        render();
      }
    });

    // checkout
    if(checkoutBtn){
      checkoutBtn.addEventListener('click', () => {
        const cart = Cart.list();
        if(!cart || cart.length === 0){ notify('Your cart is empty.'); return; }
        const user = Auth.get() || { fullName: 'Guest' };
        const paymentMethod = paymentMethodEl ? paymentMethodEl.value : 'Cash on Delivery';
        const totalVal = Number(cart.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0));
        const order = { id:`HC26-${Math.floor(Math.random()*900000+100000)}`, customer:user, paymentMethod, date:new Date().toLocaleDateString(), items:cart, total: Number(totalVal.toFixed(2)) };
        Storage.set('lastOrder', order);
        Cart.clear();
        notify('Order placed successfully!');
        window.location.href = 'order-success.html';
      });
    }

    render();
  }

  // ----- Wishlist page -----
  function initWishlistPage(){
    const container = $('#wishlistContainer');
    if(!container) return;
    const empty = $('#emptyWishlist');

    function render(){
      const list = Wishlist.list();
      container.innerHTML = '';
      if(!list || list.length === 0){
        if(empty) empty.style.display = 'block';
        return;
      }
      if(empty) empty.style.display = 'none';

      list.forEach((item, i) => {
        const el = document.createElement('div');
        el.className = 'wishlist-item';
        el.innerHTML = `
          <img src="${item.image || 'images/product1.jpg'}" alt="${item.name}">
          <h3>${item.name}</h3>
          <p>₹${formatPrice(item.price)}</p>
          <div class="wishlist-buttons">
            <button class="btn add-to-cart-from-wishlist" data-index="${i}">Add to Cart</button>
            <button class="btn btn-outline remove-wishlist" data-index="${i}">Remove</button>
          </div>
        `;
        container.appendChild(el);
      });
    }

    document.addEventListener('click', (e) => {
      if(e.target.matches('.remove-wishlist')){
        const idx = Number(e.target.dataset.index);
        Wishlist.remove(idx);
        render();
      } else if(e.target.matches('.add-to-cart-from-wishlist')){
        const idx = Number(e.target.dataset.index);
        const list = Wishlist.list();
        if(list[idx]){
          Cart.add(Object.assign({qty:1}, list[idx]));
          Wishlist.remove(idx);
          notify('Moved to cart');
          render();
        }
      }
    });

    render();
  }

  // ----- Signup / Login -----
  function initAuthForms(){
    const signupForm = $('#signupForm');
    if(signupForm){
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fullName = signupForm.querySelector('#fullName').value.trim();
        const email = signupForm.querySelector('#signupEmail').value.trim();
        const phone = signupForm.querySelector('#phone').value.trim();
        const password = signupForm.querySelector('#signupPassword').value;
        const confirm = signupForm.querySelector('#confirmPassword').value;
        if(!fullName || !email || !password){ notify('Please fill required fields'); return; }
        if(password !== confirm){ notify('Passwords do not match'); return; }
        createUserWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            return updateProfile(userCredential.user, {
              displayName: fullName
            });
          })
          .then(() => {
            Auth.set({ fullName, email, phone, id: auth.currentUser.uid });
            notify('Account created');
            window.location.href = 'login.html';
          })
          .catch((error) => {
            notify(error.message || 'Signup failed');
          });
      });
    }

    const loginForm = $('#loginForm');
    if(loginForm){
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailEl = loginForm.querySelector('#email');
        const pwdEl = loginForm.querySelector('#password');
        const email = emailEl ? emailEl.value.trim() : '';
        const password = pwdEl ? pwdEl.value : '';
        if(!email || !password){ notify('Please enter email and password'); return; }

        signInWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            Auth.set({
    fullName: userCredential.user.displayName || "",
    email: userCredential.user.email,
    id: userCredential.user.uid
});
            notify('Login successful');
            window.location.href = 'index.html';
          })
          .catch((error) => {
            notify(error.message || 'Login failed');
          });
      });

      const toggle = $('#togglePassword');
      const pwd = $('#password');
      if(toggle && pwd){
        toggle.addEventListener('click', () => {
          if(pwd.type === 'password'){ pwd.type = 'text'; toggle.textContent = 'Hide' }
          else { pwd.type = 'password'; toggle.textContent = 'Show' }
        });
      }
    }
  }

  // ----- Contact form -----
  function initContactForm(){
    const form = $('#contactForm');
    if(!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = {
        name: form.querySelector('input[type="text"]')?.value?.trim() || '',
        email: form.querySelector('input[type="email"]')?.value?.trim() || '',
        phone: form.querySelector('input[type="tel"]')?.value?.trim() || '',
        message: form.querySelector('textarea')?.value?.trim() || '',
        date: new Date().toISOString()
      };
      const messages = Storage.get('messages') || [];
      messages.push(data);
      Storage.set('messages', messages);
      notify('Thank you! Your message has been received.');
      form.reset();
    });
  }

  // ----- Checkout page -----
  function initCheckoutPage(){
    const checkoutForm = $('#checkoutForm');
    if(!checkoutForm) return;
    const cart = Cart.list();
    const summaryItems = $('#summaryItems');
    const summaryCount = $('#summaryCount');
    const summaryTotal = $('#summaryTotal');
    const summaryShipping = $('#summaryShipping');
    const summaryGrand = $('#summaryGrand');
    const SHIPPING = 49.00;

    function renderSummary(){
      const list = cart;
      if(summaryItems) summaryItems.innerHTML = '';
      if(!list || list.length === 0){
        if(summaryItems) summaryItems.innerHTML = '<p style="color:#666">Your cart is empty.</p>';
        if(summaryCount) summaryCount.textContent = 0;
        if(summaryTotal) summaryTotal.textContent = formatPrice(0);
        if(summaryGrand) summaryGrand.textContent = formatPrice(SHIPPING);
        if(summaryShipping) summaryShipping.textContent = formatPrice(SHIPPING);
        return;
      }
      let total = 0;
      let items = 0;
      list.forEach(i => {
        const price = Number(i.price) || 0;
        const qty = Number(i.qty) || 1;
        const subtotal = price * qty;
        total += subtotal; items += qty;
        const row = document.createElement('div');
        row.style = 'display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px';
        row.innerHTML = `<div style="display:flex;gap:12px;align-items:center">
          <img src="${i.image || 'images/product1.jpg'}" alt="${i.name}" style="width:64px;height:54px;object-fit:cover;border-radius:8px">
          <div><div style="font-weight:700">${i.name}</div><div style="font-size:13px;color:#666">Qty: ${qty}</div></div>
        </div><div style="font-weight:700">₹${formatPrice(subtotal)}</div>`;
        if(summaryItems) summaryItems.appendChild(row);
      });
      if(summaryCount) summaryCount.textContent = items;
      if(summaryTotal) summaryTotal.textContent = formatPrice(total);
      if(summaryShipping) summaryShipping.textContent = formatPrice(SHIPPING);
      if(summaryGrand) summaryGrand.textContent = formatPrice(total + SHIPPING);
    }

    const storedUser = Auth.get();
    if(storedUser){
      if(storedUser.fullName && $('#fullName')) $('#fullName').value = storedUser.fullName;
      if(storedUser.email && $('#email')) $('#email').value = storedUser.email;
      if(storedUser.phone && $('#phone')) $('#phone').value = storedUser.phone;
    }

    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if(!cart || cart.length === 0){ notify('Cart is empty'); return; }
      const customer = {
        fullName: $('#fullName') ? $('#fullName').value.trim() : '',
        email: $('#email') ? $('#email').value.trim() : '',
        phone: $('#phone') ? $('#phone').value.trim() : '',
        address: $('#address') ? $('#address').value.trim() : '',
        city: $('#city') ? $('#city').value.trim() : '',
        pincode: $('#pincode') ? $('#pincode').value.trim() : ''
      };
      const paymentMethod = $('#paymentMethod') ? $('#paymentMethod').value : 'Cash on Delivery';
      const subtotal = Number(summaryTotal && summaryTotal.textContent ? Number(summaryTotal.textContent) : 0) || 0;
      const shipping = Number(summaryShipping && summaryShipping.textContent ? Number(summaryShipping.textContent) : SHIPPING) || SHIPPING;
      const order = {
        id: `HC26-${Math.floor(Math.random()*900000+100000)}`,
        customer, paymentMethod, date: new Date().toLocaleDateString(),
        items: cart, subtotal, shipping, total: subtotal + shipping
      };
      Storage.set('lastOrder', order);
      Cart.clear();
      notify('Order placed — thank you!');
      window.location.href = 'order-success.html';
    });

    renderSummary();
  }

  // ----- Order success / orders page -----
  function initOrderSuccess(){
    const lastOrder = Storage.get('lastOrder');
    if(!lastOrder) return;
    const orderId = $('#orderId'), orderDate = $('#orderDate'), orderPayment = $('#orderPayment'),
          orderCustomer = $('#orderCustomer'), orderTotal = $('#orderTotal'), orderItems = $('#orderItems');
    if(!orderId) return;
    orderId.textContent = lastOrder.id || '';
    if(orderDate) orderDate.textContent = lastOrder.date || '';
    if(orderPayment) orderPayment.textContent = lastOrder.paymentMethod || '';
    if(orderCustomer) orderCustomer.textContent = (lastOrder.customer && (lastOrder.customer.fullName || lastOrder.customer.name)) || '';
    if(orderTotal) orderTotal.textContent = formatPrice(lastOrder.total || ((lastOrder.subtotal || 0) + (lastOrder.shipping || 0)));
    if(orderItems) orderItems.innerHTML = '';
    (lastOrder.items || []).forEach(it => {
      const row = document.createElement('div');
      row.style = 'display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #f5f5f5';
      row.innerHTML = `<div style="display:flex;gap:12px;align-items:center">
        <img src="${it.image || 'images/product1.jpg'}" alt="${it.name}" style="width:72px;height:64px;object-fit:cover;border-radius:8px">
        <div><div style="font-weight:700">${it.name}</div><div style="font-size:13px;color:#666">Qty: ${it.qty || 1}</div></div>
      </div><div style="font-weight:700;color:var(--accent)">₹${(Number(it.price||0) * (it.qty||1)).toFixed(2)}</div>`;
      if(orderItems) orderItems.appendChild(row);
    });
  }

  // ----- Orders list page (simple) -----
  function initOrdersList(){
    const container = $('#ordersContainer');
    if(!container) return;
    const lastOrder = Storage.get('lastOrder');
    if(lastOrder){
      container.innerHTML = `<div class="order-card" style="background:#fff;padding:20px;border-radius:12px;box-shadow:var(--card-shadow)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3>Order ${lastOrder.id}</h3>
          <span class="status processing">Processing</span>
        </div>
        <div style="display:flex;gap:18px;align-items:center">
          <img src="${lastOrder.items?.[0]?.image || 'images/product1.jpg'}" alt="" style="width:120px;height:120px;object-fit:cover;border-radius:12px">
          <div>
            <h4>${lastOrder.items?.[0]?.name || 'Item'}</h4>
            <p>Customer: ${(lastOrder.customer && lastOrder.customer.fullName) || 'Guest'}</p>
            <p>Payment: ${lastOrder.paymentMethod || 'N/A'}</p>
            <p>Date: ${lastOrder.date || ''}</p>
          </div>
        </div>
      </div>`;
    }
  }

  // ----- Contact page -----
  function initContact(){
    initContactForm();
  }

  // ----- Initialize depending on page -----
  async function loadProducts() {
  const grid = document.querySelector(".products-grid");
  if (!grid) return;

  grid.innerHTML = "";

  const snapshot = await getDocs(collection(db, "product"));

  snapshot.forEach((doc) => {
    const p = doc.data();

    grid.innerHTML += `
      <article class="product-card"
        data-name="${p.name}"
        data-price="${p.price}"
        data-image="${p.image}">
        <img src="${p.image}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p class="price">₹${p.price}</p>
        <div class="card-actions">
          <button class="btn add-to-cart">Add to Cart</button>
          <button class="btn btn-outline add-wishlist">♡ Wishlist</button>
        </div>
      </article>
    `;
  });
  }
  document.addEventListener('DOMContentLoaded', () => {
    initHeaderActions();
    initShopHandlers();
    initProductPage();
    initCartPage();
    initWishlistPage();
    initAuthForms();
    initContact();
    initCheckoutPage();
    initOrderSuccess();
    initOrdersList();
    loadProducts();
  });

})();
