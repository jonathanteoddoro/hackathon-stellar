#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, Env, Address, Symbol, 
    symbol_short
};

#[derive(Clone)]
#[contracttype]
pub struct Position {
    pub supplied: i128,
    pub borrowed: i128,
}

#[derive(Clone)]
#[contracttype]
pub struct PoolStats {
    pub total_supply: i128,
    pub total_borrow: i128,
    pub utilization_rate: i128,
    pub supply_rate: i128,
    pub borrow_rate: i128,
}

#[contract]
pub struct BlendLoanContract;

#[contractimpl]
impl BlendLoanContract {
    pub fn supply(
        env: Env,
        supplier: Address,
        amount: i128,
        asset: Symbol,
    ) {
        supplier.require_auth();
        
        if amount <= 0 {
            panic!("Amount must be positive");
        }
        
        // Store the position
        let mut position = Self::get_position_internal(&env, &supplier, &asset);
        position.supplied += amount;
        
        env.storage().instance().set(&(supplier.clone(), asset.clone()), &position);
        
        // Update pool stats
        let mut pool = Self::get_pool_stats_internal(&env, &asset);
        pool.total_supply += amount;
        env.storage().instance().set(&asset, &pool);
        
        env.events().publish((symbol_short!("supply"), &supplier, &asset), amount);
    }
    
    pub fn borrow(
        env: Env,
        borrower: Address,
        amount: i128,
        asset: Symbol,
    ) {
        borrower.require_auth();
        
        if amount <= 0 {
            panic!("Amount must be positive");
        }
        
        // Check position
        let mut position = Self::get_position_internal(&env, &borrower, &asset);
        
        // Simple collateral check (1:1 ratio for now)
        if position.supplied < position.borrowed + amount {
            panic!("Insufficient collateral");
        }
        
        position.borrowed += amount;
        
        env.storage().instance().set(&(borrower.clone(), asset.clone()), &position);
        
        // Update pool stats
        let mut pool = Self::get_pool_stats_internal(&env, &asset);
        pool.total_borrow += amount;
        env.storage().instance().set(&asset, &pool);
        
        env.events().publish((symbol_short!("borrow"), &borrower, &asset), amount);
    }
    
    pub fn repay(
        env: Env,
        borrower: Address,
        amount: i128,
        asset: Symbol,
    ) {
        borrower.require_auth();
        
        if amount <= 0 {
            panic!("Amount must be positive");
        }
        
        let mut position = Self::get_position_internal(&env, &borrower, &asset);
        
        if position.borrowed < amount {
            panic!("Repay amount exceeds debt");
        }
        
        position.borrowed -= amount;
        
        env.storage().instance().set(&(borrower.clone(), asset.clone()), &position);
        
        // Update pool stats
        let mut pool = Self::get_pool_stats_internal(&env, &asset);
        pool.total_borrow -= amount;
        env.storage().instance().set(&asset, &pool);
        
        env.events().publish((symbol_short!("repay"), &borrower, &asset), amount);
    }
    
    pub fn withdraw(
        env: Env,
        supplier: Address,
        amount: i128,
        asset: Symbol,
    ) {
        supplier.require_auth();
        
        if amount <= 0 {
            panic!("Amount must be positive");
        }
        
        let mut position = Self::get_position_internal(&env, &supplier, &asset);
        
        if position.supplied < amount {
            panic!("Insufficient supply");
        }
        
        // Check if withdrawal leaves enough collateral
        let available_to_withdraw = position.supplied - position.borrowed;
        if amount > available_to_withdraw {
            panic!("Withdrawal would create undercollateralized position");
        }
        
        position.supplied -= amount;
        
        env.storage().instance().set(&(supplier.clone(), asset.clone()), &position);
        
        // Update pool stats
        let mut pool = Self::get_pool_stats_internal(&env, &asset);
        pool.total_supply -= amount;
        env.storage().instance().set(&asset, &pool);
        
        env.events().publish((symbol_short!("withdraw"), &supplier, &asset), amount);
    }
    
    pub fn get_position(env: Env, user: Address, asset: Symbol) -> Position {
        env.storage()
            .instance()
            .get(&(user.clone(), asset.clone()))
            .unwrap_or(Position {
                supplied: 0,
                borrowed: 0,
            })
    }
    
    pub fn get_pool_stats(env: Env, asset: Symbol) -> PoolStats {
        env.storage()
            .instance()
            .get(&asset)
            .unwrap_or(PoolStats {
                total_supply: 0,
                total_borrow: 0,
                utilization_rate: 0,
                supply_rate: 0,
                borrow_rate: 0,
            })
    }
    
    // Helper functions for internal use
    fn get_position_internal(env: &Env, user: &Address, asset: &Symbol) -> Position {
        env.storage()
            .instance()
            .get(&(user.clone(), asset.clone()))
            .unwrap_or(Position {
                supplied: 0,
                borrowed: 0,
            })
    }
    
    fn get_pool_stats_internal(env: &Env, asset: &Symbol) -> PoolStats {
        env.storage()
            .instance()
            .get(asset)
            .unwrap_or(PoolStats {
                total_supply: 0,
                total_borrow: 0,
                utilization_rate: 0,
                supply_rate: 0,
                borrow_rate: 0,
            })
    }
}