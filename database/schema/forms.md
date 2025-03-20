

## **Frontend Forms – Visual Summary**

Below is a visual table summary of the forms required to fill in data for all tables in your POS system:

### **1. Categories Form**
| Field Label    | Field Type | Required | Notes                                            |
|----------------|------------|----------|--------------------------------------------------|
| Category Name  | Text Input | Yes      | e.g., "Beverages", "Electronics"                 |
| Company        | Text Input | Yes      | e.g., "Coca-Cola", "Samsung"                     |

---

### **2. Suppliers Form**
| Field Label   | Field Type | Required | Notes                                |
|---------------|------------|----------|--------------------------------------|
| Supplier Name | Text Input | Yes      | e.g., "Tech Supplies Ltd"            |
| Contact       | Text Input | Yes      | Phone or email                      |

---

### **3. Supplier Price History Form**
| Field Label   | Field Type  | Required | Notes                                         |
|---------------|-------------|----------|-----------------------------------------------|
| Supplier      | Dropdown    | Yes      | Select from Suppliers                         |
| Product       | Dropdown    | Yes      | Select from Products                          |
| Price         | Number Input| Yes      | New price                                     |
| Date Added    | Date Picker | No       | Defaults to current date                      |

---

### **4. Products Form**
| Field Label    | Field Type   | Required | Notes                                                   |
|----------------|--------------|----------|---------------------------------------------------------|
| Product Name   | Text Input   | Yes      | e.g., "Premium Rice", "Wireless Mouse"                  |
| Company        | Text Input   | Yes      | Manufacturer or brand                                   |
| Category       | Dropdown     | Yes      | Populate from Categories table                          |
| Price Bought   | Number Input | Yes      | Must be a positive number                               |
| Price Sold     | Number Input | Yes      | Must be ≥ Price Bought                                  |
| Stock          | Number Input | Yes      | Available quantity                                      |
| Minimum Stock  | Number Input | Yes      | Threshold to trigger reorder alert                     |
| Status         | Dropdown     | Yes      | e.g., "available" or "out of stock"                     |
| Supplier       | Dropdown     | Yes      | Populate from Suppliers table                           |
| Unit           | Text Input   | Yes      | e.g., "kg", "pcs"                                       |

---

### **5. Sales Form**
| Field Label   | Field Type   | Required | Notes                                                      |
|---------------|--------------|----------|------------------------------------------------------------|
| Product       | Dropdown     | Yes      | Select from Products                                       |
| Quantity      | Number Input | Yes      | Number of items sold                                       |
| Price Sold    | Number Input | Yes      | Can be auto-filled based on product selection              |
| Discount      | Number Input | Optional | Discount applied (defaults to 0)                           |
| Sale Type     | Dropdown     | Yes      | Options: "cash", "debt"                                      |
| Customer      | Dropdown     | Optional | Required if Sale Type is "debt"                             |

---

### **6. Debts Form**
| Field Label       | Field Type   | Required | Notes                                                |
|-------------------|--------------|----------|------------------------------------------------------|
| Customer          | Dropdown     | Yes      | Select from Customers table                           |
| Total Amount      | Number Input | Yes      | Total debt amount                                     |
| Remaining Amount  | Number Input | Yes      | Automatically updated via partial payments            |
| Last Payment Date | Date Picker  | No       | Auto-updated when a payment is received               |

---

### **7. Debt Payment Form**
| Field Label  | Field Type    | Required | Notes                                     |
|--------------|---------------|----------|-------------------------------------------|
| Debt         | Dropdown      | Yes      | Select active debt record                  |
| Customer     | Dropdown      | Yes      | Select customer (linked to debt)           |
| Amount Paid  | Number Input  | Yes      | Payment amount                             |
| Payment Date | Date Picker   | No       | Defaults to current date if not provided    |

---

### **8. Customers Form**
| Field Label   | Field Type   | Required | Notes                                |
|---------------|--------------|----------|--------------------------------------|
| Customer Name | Text Input   | Yes      | Full name of the customer            |
| Contact       | Text Input   | Yes      | Phone or email                       |

---

### **9. Returns Form**
| Field Label   | Field Type   | Required | Notes                                   |
|---------------|--------------|----------|-----------------------------------------|
| Product       | Dropdown     | Yes      | Select product being returned           |
| Quantity      | Number Input | Yes      | Number of items returned                 |
| Reason        | Text Area    | Yes      | Reason for return                        |
| Return Date   | Date Picker  | No       | Defaults to current date                 |

---

### **10. Expenses Form**
| Field Label   | Field Type   | Required | Notes                                        |
|---------------|--------------|----------|----------------------------------------------|
| Description   | Text Area    | Yes      | Brief description of the expense              |
| Amount        | Number Input | Yes      | Expense amount                                  |
| Date          | Date Picker  | No       | Defaults to current date                        |

---

### **11. Asked Products Form**
| Field Label    | Field Type  | Required | Notes                                                |
|----------------|-------------|----------|------------------------------------------------------|
| Product Name   | Text Input  | Yes      | Name of the requested product                         |
| Requested By   | Text Input  | Optional | Customer name or "anonymous"                           |
| Request Date   | Date Picker | No       | Defaults to current date                                |

---

### **12. Analytics Dashboard**  
*(Read-only view; no data entry form)*  
| Metric                      | Data Source                                 | Notes                                        |
|-----------------------------|---------------------------------------------|----------------------------------------------|
| Most Sold Product           | Aggregated from Sales                       | Highest number of units sold                 |
| Highest Profit Product      | Computed from Products and Sales            | Based on profit (price_sold - price_bought)    |
| Lowest Stock Product        | Products (stock compared with min_stock)    | For reorder alerts                           |
| Most Buying Customer        | Aggregated from Sales                       | Customer with the highest total purchase value |
| Total Gross Profit          | Calculated from Sales and Products          | Overall profit, accounting for discounts      |

---

## **Summary**
- **Each form corresponds to a database table**.
- The forms cover all required aspects: products, categories, suppliers, sales, debts & payments, customers, returns, expenses, and asked products.
- **Analytics dashboard** is read-only and aggregates data from these tables.

This visual summary should guide your frontend form design to cover all necessary data inputs for your POS system. 

Let me know if you need further modifications or additional details!