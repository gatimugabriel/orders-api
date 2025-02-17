/** ------------------------- SCHEMA ----------------------//
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         userID:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productID:
 *                 type: integer
 *               quantity:
 *                 type: integer
 */


/** ------------------------- ENDPOINTS ----------------------//
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productID:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *               shippingAddress:
 *                  type: "string"
 *               deliveryMethod:
 *                  type: string
 *                  enum: [door-delivery, pickup-station]
 *               paymentGatewayProvider:
 *                  type: string
 *                  enum: [STRIPE, PAYPAL]
 *               paymentMethod:
 *                  type: string
 *                  enum: [CARD, CRYPTO]
 *               paymentMode:
 *                  type: string
 *                  enum: [ONDELIVERY, ONLINE]
 *     responses:
 *       201:
 *         description: Order created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *
 *   get:
 *     summary: Get all orders with pagination
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, COMPLETED, CANCELLED]
 *         description: Filter orders by status
 *     responses:
 *       200:
 *         description: List of orders retrieved successfully
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Forbidden
 *
 * /orders/search/s:
 *   get:
 *     summary: Search an order
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, COMPLETED, CANCELLED]
 *         description: Filter orders by status
 *     responses:
 *       200:
 *         description: Orders details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - InsufficientPermissions
 *       404:
 *         description: Order not found
 *
 * /orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to view this order
 *       404:
 *         description: Order not found
 *
 *   put:
 *     summary: Update order details
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               shipping_address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not authorized to view this order
 *       404:
 *         description: Order not found
 *
 *   delete:
 *     summary: Delete order by ID (marks as 'CANCELLED')
 *     security:
 *       - bearerAuth: []
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient Permissions
 *       404:
 *         description: Order not found or may have already been deleted
 *
 * /orders/me:
 *   get:
 *     summary: Get my orders with pagination
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, COMPLETED, CANCELLED]
 *         description: Filter orders by status
 *     responses:
 *       200:
 *         description: List of users orders retrieved successfully
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Forbidden, Not authorized to view this order
 */