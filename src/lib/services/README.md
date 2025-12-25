# Service Layer Architecture - Business Logic Hub

## 🎯 Overview

The Service Layer is the **BRAIN** of the Saanify application. It centralizes all business logic, calculations, and data validation rules. This ensures consistency, maintainability, and separation of concerns.

## 📁 Directory Structure

```
src/lib/services/
├── index.ts                 # Export hub for all services
├── transaction.service.ts    # Passbook & Loan synchronization
├── loan.service.ts          # Loan validation & approval rules
└── maturity.service.ts      # Maturity calculations & records
```

## 🔧 Services

### 1. TransactionService (`transaction.service.ts`)

**Purpose**: Handles all financial transactions with proper business logic and ensures loan-passbook synchronization.

**Key Features**:
- ✅ **Database Transactions**: Uses `db.$transaction` for data consistency
- ✅ **Smart Interest Calculation**: 1% monthly interest on remaining loan balance
- ✅ **Loan Balance Updates**: Automatically updates loan remaining balance
- ✅ **Loan Closure**: Marks loans as CLOSED when fully paid
- ✅ **Type Safety**: Full TypeScript support with interfaces

**Core Methods**:
```typescript
// Create transaction entry (DEPOSIT, INSTALLMENT, FINE, etc.)
TransactionService.createEntry(request: CreateEntryRequest): Promise<TransactionResult>

// Get total deposits for a member
TransactionService.getTotalDeposits(memberId: string): Promise<number>

// Get current balance (Deposits - Installments)
TransactionService.getCurrentBalance(memberId: string): Promise<number>

// Get transaction history
TransactionService.getTransactionHistory(memberId: string, limit?: number): Promise<any[]>

// Delete transaction entry (with validation)
TransactionService.deleteEntry(entryId: string, memberId: string): Promise<TransactionResult>
```

**Business Logic**:
- **INSTALLMENT**: Calculates interest (1% of remaining balance) + principal
- **DEPOSIT**: Simply adds to passbook and updates member cache
- **FINE**: Creates fine entry linked to loan
- **EXPENSE**: Creates negative deposit entry

---

### 2. LoanService (`loan.service.ts`)

**Purpose**: Manages loan validation, creation, and approval rules including the **80% rule**.

**Key Features**:
- ✅ **80% Rule Validation**: Max loan = Total deposits × 80%
- ✅ **Active Loan Check**: Prevents multiple active loans
- ✅ **Minimum Amount Validation**: ₹1,000 minimum loan
- ✅ **Override Support**: Admin can override rules
- ✅ **Loan Statistics**: Comprehensive loan analytics

**Core Methods**:
```typescript
// Validate loan request based on business rules
LoanService.validateLoanRequest(memberId: string, amount: number, override?: boolean): Promise<LoanValidationResult>

// Create new loan after validation
LoanService.createLoan(request: LoanRequest): Promise<CreateLoanResult>

// Get member loans
LoanService.getMemberLoans(memberId: string, includeClosed?: boolean): Promise<any[]>

// Get active loans (for admin dashboard)
LoanService.getActiveLoans(): Promise<any[]>

// Get overdue loans
LoanService.getOverdueLoans(): Promise<any[]>

// Close loan manually
LoanService.closeLoan(loanId: string, reason?: string): Promise<boolean>

// Get member loan statistics
LoanService.getMemberLoanStats(memberId: string): Promise<any>
```

**Business Rules**:
- **Maximum Loan**: Total deposits × 80%
- **Minimum Loan**: ₹1,000
- **One Active Loan**: Members can't have multiple active loans
- **Interest Rate**: 1% per month
- **Override**: Admin can bypass rules if needed

---

### 3. MaturityService (`maturity.service.ts`)

**Purpose**: Handles maturity calculations, interest accrual, and maturity record management.

**Key Features**:
- ✅ **Auto Interest Calculation**: ~1% annual rate
- ✅ **Maturity Timeline**: 36 months (3 years) default
- ✅ **Loan Adjustments**: Deducts pending loans from maturity
- ✅ **Claim Processing**: Handles maturity claims with passbook entries
- ✅ **Batch Updates**: Can update all records at once

**Core Methods**:
```typescript
// Calculate maturity for a member
MaturityService.calculateMaturity(memberId: string): Promise<MaturityResult>

// Create or update maturity record
MaturityService.createOrUpdateMaturityRecord(memberId: string, manualOverride?: boolean): Promise<CreateMaturityRecordResult>

// Get maturity record for a member
MaturityService.getMaturityRecord(memberId: string): Promise<any>

// Process maturity claim
MaturityService.claimMaturity(recordId: string): Promise<{ success: boolean, error?: string }>

// Update all maturity records (batch job)
MaturityService.updateAllMaturityRecords(): Promise<{ updated: number, errors: number }>

// Get members approaching maturity
MaturityService.getMembersApproachingMaturity(): Promise<any[]>

// Adjust maturity interest (admin function)
MaturityService.adjustMaturityInterest(recordId: string, adjustedInterest: number, reason?: string): Promise<boolean>

// Get maturity summary for dashboard
MaturityService.getMaturitySummary(): Promise<any>
```

**Maturity Formula**:
```
NetPayable = (TotalDeposit + TotalInterest) - PendingLoan

Where:
- TotalInterest = TotalDeposit × 0.0333333333 × MonthsCompleted
- PendingLoan = Sum of active loan balances
- Maturity Period = 36 months (3 years)
```

---

## 🔗 API Integration

### Updated API Routes

1. **Passbook API** (`/api/client/passbook/create/route.ts`)
   - Now uses `TransactionService.createEntry()`
   - Automatic loan balance synchronization
   - Proper transaction handling

2. **Loan API** (`/api/client/loan-request/create/route.ts`)
   - Now uses `LoanService.createLoan()`
   - 80% rule validation
   - Comprehensive error messages

3. **Maturity API** (`/api/maturity/route.ts`)
   - Now uses `MaturityService.updateAllMaturityRecords()`
   - New: `/api/maturity/calculate/route.ts` for individual calculations
   - New: `/api/maturity/claim/route.ts` for processing claims

---

## 🚀 Benefits

### ✅ **Centralized Logic**
- All business rules in one place
- Easy to modify and maintain
- Consistent behavior across the application

### ✅ **Data Consistency**
- Database transactions prevent partial updates
- Loan-passbook synchronization guaranteed
- No more disconnected calculations

### ✅ **Type Safety**
- Full TypeScript interfaces
- Compile-time error checking
- Better IDE support

### ✅ **Testability**
- Services can be unit tested independently
- Mock database calls for testing
- Clear input/output contracts

### ✅ **Maintainability**
- Easy to add new business rules
- Simple to modify existing calculations
- Clear separation of concerns

---

## 📊 Usage Examples

### Creating a Passbook Entry
```typescript
import { TransactionService } from '@/lib/services';

const result = await TransactionService.createEntry({
  memberId: 'member-123',
  type: 'INSTALLMENT',
  amount: 5000,
  description: 'Monthly loan payment',
  mode: 'CASH'
});

if (result.success) {
  console.log('Transaction created:', result.data);
} else {
  console.error('Transaction failed:', result.error);
}
```

### Validating a Loan Request
```typescript
import { LoanService } from '@/lib/services';

const validation = await LoanService.validateLoanRequest('member-123', 50000);

if (validation.approved) {
  console.log('Loan approved:', validation.message);
} else {
  console.log('Loan rejected:', validation.error);
  console.log('Max allowed:', validation.maxLoanAmount);
}
```

### Calculating Maturity
```typescript
import { MaturityService } from '@/lib/services';

const calculation = await MaturityService.calculateMaturity('member-123');

if (calculation.success) {
  console.log('Net payable:', calculation.data.netPayable);
  console.log('Status:', calculation.data.status);
}
```

---

## 🔧 Configuration

### Interest Rates
- **Loan Interest**: 1% per month (defined in `LoanService.DEFAULT_INTEREST_RATE`)
- **Maturity Interest**: ~1% annual rate (defined in `MaturityService.MONTHLY_INTEREST_RATE`)

### Business Rules
- **Loan-to-Deposit Ratio**: 80% (defined in `LoanService.LOAN_TO_DEPOSIT_RATIO`)
- **Maturity Period**: 36 months (defined in `MaturityService.DEFAULT_MATURITY_MONTHS`)
- **Minimum Loan**: ₹1,000 (defined in `LoanService.createLoan()`)

---

## 🎯 Next Steps

1. **Frontend Integration**: Update frontend to use new API responses
2. **Error Handling**: Implement proper error boundaries and user notifications
3. **Testing**: Write unit tests for all service methods
4. **Monitoring**: Add logging and monitoring for business operations
5. **Documentation**: Create API documentation for frontend developers

---

## 📝 Notes

- All services use database transactions to ensure data consistency
- Error handling is comprehensive with meaningful error messages
- The service layer is designed to be stateless and scalable
- Future business rules can be easily added to the respective services
- The architecture supports easy testing and maintenance