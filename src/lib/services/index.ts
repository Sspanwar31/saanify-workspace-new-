/**
 * Service Layer - Central Business Logic Hub
 * 
 * This is the BRAIN of the Saanify application.
 * All financial operations, validations, and business rules are centralized here.
 * 
 * Services:
 * - TransactionService: Handles passbook entries and loan balance synchronization
 * - LoanService: Manages loan validation, creation, and approval rules (80% rule)
 * - MaturityService: Calculates and manages maturity records and interest
 */

export { TransactionService } from './transaction.service';
export { LoanService } from './loan.service';
export { MaturityService } from './maturity.service';

export type {
  CreateEntryRequest,
  TransactionResult
} from './transaction.service';

export type {
  LoanRequest,
  LoanValidationResult,
  CreateLoanResult
} from './loan.service';

export type {
  MaturityCalculation,
  MaturityResult,
  CreateMaturityRecordResult
} from './maturity.service';