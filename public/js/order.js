function changeQty(id, quantitiy, event) {
    const input = document.getElementById(`product${id}`);
    const temp = parseInt(input.value) + quantitiy
    const newValue = temp > 0 ? temp : 0;
    input.value = newValue;
    console.log(`changed ${id}`)
    qtyChanged()
    event.preventDefault()
}

function qtyChanged() {
    const summary = document.getElementById('summary')
    const qtyElements = document.querySelectorAll('.quantitiy')
    const orderBtn = document.getElementById('orderBtn')
    const totalElement = document.getElementById('total')
    summary.innerHTML = ""
    let total = 0
    for (const qtyElement of qtyElements) {
        const data = qtyElement.dataset
        const quantitiy = parseInt(qtyElement.value);
        const pretotal = quantitiy * parseInt(data.price)
        if (quantitiy > 0) {
            total += pretotal
            summary.innerHTML += `
            <div class="row">
                <div class="col-4"><span class="text-capitalize">${data.name}</span></div>
                <div class="col-4 text-center">${quantitiy} x ${formatNumber(data.price)}</div>
                <div class="col-4 text-end"><span class="price">${formatNumber(pretotal)}</span></div>
            </div>
            `
        }
    }
    if (total > 0) {
        orderBtn.disabled = false
    } else {
        summary.innerHTML += `
        <div class="d-flex justify-content-between">
            <p>No Order</p>
            <p>- x -</p>
            <p class='price'>-</p>
        </div>
        `
        orderBtn.disabled = true
    }
    totalElement.textContent = formatNumber(total);
}

function formatNumber(number) {
    number = number.toString();
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function validatePhone(phoneInput) {
    const phoneNumber = libphonenumber.parsePhoneNumber(phoneInput, 'ID')
    return phoneNumber.isValid()
}

const orderForm = document.getElementById('orderForm');
const telInput = document.getElementById('phone');

orderForm.addEventListener('submit', event => {
    event.preventDefault();
    if (validatePhone(telInput.value)) {
        const orderBtn = document.getElementById('orderBtn')
        telInput.classList.add('is-valid')
        orderBtn.innerHTML = `
        <div class="spinner-border" role="status">
        <span class="visually-hidden">Loading...</span>
        </div>
        `
        orderBtn.disabled = true

        const formData = new FormData(orderForm);
        const postData = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            orders: []
        };
        const qtyElements = document.querySelectorAll('.quantitiy')
        for (const qtyElement of qtyElements) {
            const quantitiy = parseInt(qtyElement.value);
            if (quantitiy > 0) {
                postData.orders.push({
                    id: qtyElement.dataset.id,
                    quantity: quantitiy,
                })
            }
        }

        fetch('/api/order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
        })
            .then(response => response.json())
            .then(result => window.location.replace(`/track?orderid=${result.orderid}`))
            .catch(error => console.error('Error:', error));
    } else {
        telInput.classList.add('is-invalid')
    }
}, false)

document.addEventListener('DOMContentLoaded', async () => {
    const products = await (await fetch('/api/product')).json()
    const productContainer = document.getElementById('products')
    if (products) {
        productContainer.innerHTML = ""
        products.forEach(product => {
            console.log(product)
            productContainer.innerHTML += `
                <div class="col-12 col-md-4 p-3">
                    <div class="card w-100 p-3">
                        <img src="/img/coffee-cup.svg" class="card-img-top product-img m-auto"
                            alt="${product.name} picture">
                        <div class="card-body">
                            <p class="card-title text-center text-capitalize fs-5">
                            ${product.name}
                            </p>
                            <p class="card-text text-center">Rp. <span class="price">
                                ${product.price}
                                </span>
                            </p>
                            <div class="d-flex align-items-center">
                                <button class="rounded-circle order-qty-btn border"
                                    onclick="changeQty('${product.id}',-1,event)">-</button>
                                <input type="number" class="form-control text-center quantitiy mx-1" value="0"
                                    name="order-${product.id}" id="product${product.id}"
                                    onchange="qtyChanged()" data-id='${product.id}'
                                    data-name='${product.name}' data-price='${product.price}'>
                                <button class="rounded-circle order-qty-btn border"
                                    onclick="changeQty('${product.id}',1,event)">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            `
        })
    }
    const priceElements = document.querySelectorAll('.price')
    for (const priceElement of priceElements) {
        priceElement.textContent = formatNumber(priceElement.textContent);
    }
});