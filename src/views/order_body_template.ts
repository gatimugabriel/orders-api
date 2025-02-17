type OrderTemplate = {
    subject: string,
    htmlBody: string
}

// Formats order details for beautiful display on emails
export const styleOrderDetails = (orderDetails: any): OrderTemplate => {
    if (!orderDetails.items || !orderDetails.items.every((item: any) => item.product)) {
        throw new Error("Order details are missing product information.");
    }

    const subject = 'Order Confirmation - Thank you for shopping with us!';
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatPrice = (price: number) => {
        return (price / 100).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
        });
    };

    const calculateDiscountedPrice = (price: number, discountRate: number) => {
        return price * (1 - discountRate / 100);
    };

    const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    margin: 0;
                    padding: 0;
                    -webkit-font-smoothing: antialiased;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 40px 20px;
                    background-color: #ffffff;
                }
                .header {
                    text-align: center;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #f4f4f4;
                }
                .logo {
                    max-width: 150px;
                    margin-bottom: 20px;
                }
                .order-info {
                    padding: 20px 0;
                    border-bottom: 2px solid #f4f4f4;
                }
                .order-details {
                    margin: 20px 0;
                }
                .product-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                .product-table th {
                    background-color: #f8f9fa;
                    padding: 12px;
                    text-align: left;
                }
                .product-table td {
                    padding: 12px;
                    border-top: 1px solid #dee2e6;
                }
                .product-image {
                    width: 80px;
                    height: 80px;
                    object-fit: cover;
                    border-radius: 4px;
                }
                .summary {
                    background-color: #f8f9fa;
                    padding: 20px;
                    border-radius: 4px;
                    margin-top: 20px;
                }
                .footer {
                    text-align: center;
                    padding-top: 20px;
                    color: #6c757d;
                    font-size: 14px;
                }
                .btn {
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #007bff;
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    margin-top: 20px;
                }
                @media only screen and (max-width: 600px) {
                    .container {
                        padding: 20px 10px;
                    }
                    .product-image {
                        width: 60px;
                        height: 60px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Order Confirmation</h1>
                    <p>Thank you for your order!</p>
                </div>
                
                <div class="order-info">
                    <h2>Order Details</h2>
                    <p><strong>Order ID:</strong> #${orderDetails.id}</p>
                    <p><strong>Order Date:</strong> ${formatDate(orderDetails.createdAt)}</p>
                    <p><strong>Order Status:</strong> ${orderDetails.status}</p>
                </div>

                <div class="order-details">
                    <h3>Delivery Information</h3>
                    <p><strong>Shipping Address:</strong> ${orderDetails.shippingAddress}</p>
                    <p><strong>Delivery Method:</strong> ${orderDetails.deliveryMethod}</p>
                </div>

                <table class="product-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orderDetails?.items?.map((item:any) => `
                            <tr>
                                <td>
                                    <img src="${item.product.images[0]}" alt="${item.product.name}" class="product-image">
                                    <p><strong>${item.product.name}</strong></p>
                                </td>
                                <td>${item.quantity}</td>
                                <td>
                                    <p>${formatPrice(calculateDiscountedPrice(item.price_at_time, item.discount_rate_at_time) * item.quantity)}</p>
                                    ${item.discount_rate_at_time > 0 ?
        `<small style="color: #dc3545;">-${item.discount_rate_at_time}% OFF</small>` :
        ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="summary">
                    <h3>Order Summary</h3>
                    <p><strong>Total Items:</strong> ${orderDetails.totalItems}</p>
                    <p><strong>Total Amount:</strong> ${formatPrice(orderDetails.totalPrice)}</p>
                </div>

                <div style="text-align: center;">
                    <a href="#" class="btn">Track Your Order</a>
                </div>

                <div class="footer">
                    <p>If you have any questions, please contact our customer service.</p>
                    <p>© ${new Date().getFullYear()} G Shop. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return {
        subject,
        htmlBody
    };
};