let targetOrders = { orders: {} }

const cancelBtn = document.getElementById('cancelBtn')
const editBtn = document.getElementById('editBtn')

function formatNumber(number) {
    number = number.toString();
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function changeOrder(productid, value) {
    targetOrders['orders'][productid] = parseInt(value)
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const orderid = params.get('orderid') ? parseInt(params.get('orderid')) : null;
    if (orderid) {
        const progressBar = document.getElementById('progressBar');
        const statusMessage = document.getElementById('statusMessage');
        const clientName = document.getElementById('name');
        const clientPhone = document.getElementById('phone');
        try {
            const orderData = await (await fetch(`/api/order/${orderid}`)).json()
            if (!orderData.error) {
                const summary = document.getElementById('summary');
                const totalElement = document.getElementById('total');
                progressBar.style.width = `${orderData.progress}%`
                statusMessage.textContent = orderData.description
                summary.innerHTML = "";
                clientName.textContent = orderData.name
                clientPhone.textContent = orderData.phone
                let total = 0
                targetOrders.id = orderid
                orderData.orders.forEach(order => {
                    const temp = order.price * order.quantity
                    total += temp
                    summary.innerHTML += `
                    <div class="row my-2 align-items-center">
                        <div class="col-4"><span class="text-capitalize">${order.name}</span></div>
                        <div class="col-4 text-center d-flex align-items-center justify-content-center"><input type="number" name="order-${order.id}" class="form-control w-25 me-2" value="${order.quantity}" placeholder="Qty" onchange=changeOrder(${order.id},this.value)> x ${formatNumber(order.price)}</input></div>
                        <div class="col-4 text-end"><span class="price">${formatNumber(temp)}</span></div>
                    </div>
                    `
                })
                totalElement.textContent = formatNumber(total)
            } else {
                throw new Error('Order not Found');
            }

        } catch (err) {
            progressBar.classList.add('bg-danger')
            progressBar.style.width = '100%'
            cancelBtn.disabled = true
            editBtn.disabled = true
            statusMessage.textContent = err.message
        }
    }
})

document.getElementById('editForm').onsubmit = (event) => {
    event.preventDefault();

    editBtn.innerHTML = `
    <div class="spinner-border" role="status">
    <span class="visually-hidden">Loading...</span>
    </div>
    `
    editBtn.disabled = true
    const newOrders = Object.entries(targetOrders.orders).map(([productid, quantity]) => ({ id: parseInt(productid), quantity: quantity }))
    fetch(`/api/order/${targetOrders.id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orders: newOrders })
    })
        .then((response) => location.reload())
        .catch(error => console.error('Error:', error));
}

cancelBtn.onclick = (event) => {
    event.preventDefault()
    event.target.innerHTML = `
    <div class="spinner-border" role="status">
    <span class="visually-hidden">Loading...</span>
    </div>
    `
    fetch(`/api/order/${targetOrders.id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(() => window.location.replace('/track'))
        .catch(error => console.error('Error:', error));
}