use soroban_sdk::{contract, contractimpl, Env, Address, String};

use crate::errors::ContractError;
use crate::events;
use crate::storage;
use crate::types::{Event, Ticket};

#[contract]
pub struct NFTTicketContract;

#[contractimpl]
impl NFTTicketContract {
    // ========================================================================
    // Initialization
    // ========================================================================

    /// Initializes the contract with an admin address.
    /// Can only be called once. The admin has the power to create events.
    ///
    /// # Arguments
    /// * `admin` - The administrative address for the contract
    pub fn initialize(env: Env, admin: Address) -> Result<(), ContractError> {
        if storage::has_admin(&env) {
            return Err(ContractError::AlreadyInitialized);
        }

        admin.require_auth();
        storage::set_admin(&env, &admin);
        Ok(())
    }

    // ========================================================================
    // Event Management
    // ========================================================================

    /// Creates a new event on the platform.
    /// Only the contract admin or a designated organizer can create events.
    ///
    /// # Arguments
    /// * `organizer` - The address of the event organizer (must authorize)
    /// * `event_id` - Unique string identifier for the event
    /// * `title` - Human-readable event title
    /// * `date` - Event date string
    /// * `location` - Venue / location description
    /// * `category` - Category tag (Conference, Workshop, Exhibition, etc.)
    /// * `price` - Ticket price in stroops
    /// * `currency` - The currency symbol for the price
    /// * `max_supply` - Maximum number of tickets available
    pub fn create_event(
        env: Env,
        organizer: Address,
        event_id: String,
        title: String,
        date: String,
        location: String,
        category: String,
        price: u64,
        currency: String,
        max_supply: u32,
    ) -> Result<(), ContractError> {
        // Require organizer authorization
        organizer.require_auth();

        // Verify the contract is initialized
        if !storage::has_admin(&env) {
            return Err(ContractError::NotInitialized);
        }

        // Ensure the event_id doesn't already exist
        if storage::get_event(&env, &event_id).is_some() {
            return Err(ContractError::EventAlreadyExists);
        }

        // Validate max_supply
        if max_supply == 0 {
            return Err(ContractError::InvalidInput);
        }

        let event = Event {
            event_id: event_id.clone(),
            title,
            date,
            location,
            category,
            price,
            currency,
            organizer: organizer.clone(),
            max_supply,
            minted_count: 0,
            is_active: true,
        };

        storage::set_event(&env, &event);
        events::event_created(&env, &event_id, &organizer);

        Ok(())
    }

    /// Deactivates an event, preventing further ticket minting.
    /// Only the event's organizer can deactivate it.
    ///
    /// # Arguments
    /// * `organizer` - The organizer address (must match original and authorize)
    /// * `event_id` - The event to deactivate
    pub fn deactivate_event(
        env: Env,
        organizer: Address,
        event_id: String,
    ) -> Result<(), ContractError> {
        organizer.require_auth();

        let mut event = storage::get_event(&env, &event_id)
            .ok_or(ContractError::EventNotFound)?;

        // Only the original organizer can deactivate
        if event.organizer != organizer {
            return Err(ContractError::Unauthorized);
        }

        event.is_active = false;
        storage::set_event(&env, &event);
        events::event_deactivated(&env, &event_id);

        Ok(())
    }

    // ========================================================================
    // Ticket Minting (Soulbound / Non-Transferable)
    // ========================================================================

    /// Mints a non-transferable (soulbound) NFT ticket to an attendee.
    ///
    /// The ticket is permanently bound to the `attendee` address and cannot
    /// be transferred. This mirrors the AUTH_REQUIRED + AUTH_REVOCABLE pattern
    /// used in the frontend's Stellar classic asset operations, but enforces
    /// non-transferability at the smart contract level.
    ///
    /// # Arguments
    /// * `attendee` - The wallet address receiving the ticket (must authorize)
    /// * `event_id` - The event to mint a ticket for
    ///
    /// # Returns
    /// The newly minted ticket's unique ID
    pub fn mint_ticket(
        env: Env,
        attendee: Address,
        event_id: String,
    ) -> Result<u64, ContractError> {
        // Require attendee authorization
        attendee.require_auth();

        // Verify contract is initialized
        if !storage::has_admin(&env) {
            return Err(ContractError::NotInitialized);
        }

        // Load and validate event
        let mut event = storage::get_event(&env, &event_id)
            .ok_or(ContractError::EventNotFound)?;

        if !event.is_active {
            return Err(ContractError::EventNotActive);
        }

        if event.minted_count >= event.max_supply {
            return Err(ContractError::SoldOut);
        }

        // Enforce 1 ticket per user per event
        if storage::get_attendee_ticket(&env, &event_id, &attendee).is_some() {
            return Err(ContractError::AlreadyOwnsTicket);
        }

        // Generate unique ticket ID
        let ticket_id = storage::next_ticket_id(&env);

        let ticket = Ticket {
            ticket_id,
            event_id: event_id.clone(),
            owner: attendee.clone(),
            minted_at: env.ledger().timestamp(),
            is_used: false,
        };

        // Store the ticket
        storage::set_ticket(&env, &ticket);
        storage::set_attendee_ticket(&env, &event_id, &attendee, ticket_id);

        // Update event minted count
        event.minted_count += 1;
        storage::set_event(&env, &event);

        // Emit minting event for off-chain indexers / frontend
        events::ticket_minted(&env, ticket_id, &event_id, &attendee);

        Ok(ticket_id)
    }

    // ========================================================================
    // Ticket Validation & Check-In
    // ========================================================================

    /// Validates a ticket at the event entrance and marks it as used.
    /// Only the event organizer can check in tickets.
    ///
    /// # Arguments
    /// * `organizer` - The event organizer (must authorize)
    /// * `ticket_id` - The ticket to validate
    pub fn check_in(
        env: Env,
        organizer: Address,
        ticket_id: u64,
    ) -> Result<(), ContractError> {
        organizer.require_auth();

        let mut ticket = storage::get_ticket(&env, ticket_id)
            .ok_or(ContractError::TicketNotFound)?;

        // Verify the caller is the organizer of the event
        let event = storage::get_event(&env, &ticket.event_id)
            .ok_or(ContractError::EventNotFound)?;

        if event.organizer != organizer {
            return Err(ContractError::Unauthorized);
        }

        if ticket.is_used {
            return Err(ContractError::TicketAlreadyUsed);
        }

        ticket.is_used = true;
        storage::set_ticket(&env, &ticket);
        events::ticket_checked_in(&env, ticket_id, &ticket.event_id);

        Ok(())
    }

    // ========================================================================
    // View / Query Functions
    // ========================================================================

    /// Retrieves event details by event ID.
    pub fn get_event(env: Env, event_id: String) -> Result<Event, ContractError> {
        storage::get_event(&env, &event_id).ok_or(ContractError::EventNotFound)
    }

    /// Retrieves ticket details by ticket ID.
    pub fn get_ticket(env: Env, ticket_id: u64) -> Result<Ticket, ContractError> {
        storage::get_ticket(&env, ticket_id).ok_or(ContractError::TicketNotFound)
    }

    /// Checks if a user owns a ticket for a specific event and returns the ticket ID.
    pub fn get_user_ticket(
        env: Env,
        event_id: String,
        user: Address,
    ) -> Result<u64, ContractError> {
        storage::get_attendee_ticket(&env, &event_id, &user)
            .ok_or(ContractError::TicketNotFound)
    }

    /// Returns the number of remaining tickets for an event.
    pub fn get_remaining_tickets(env: Env, event_id: String) -> Result<u32, ContractError> {
        let event = storage::get_event(&env, &event_id)
            .ok_or(ContractError::EventNotFound)?;
        Ok(event.max_supply - event.minted_count)
    }

    /// Verifies if a ticket is valid (exists, belongs to the user, and hasn't been used).
    pub fn verify_ticket(
        env: Env,
        ticket_id: u64,
        owner: Address,
    ) -> Result<bool, ContractError> {
        let ticket = storage::get_ticket(&env, ticket_id)
            .ok_or(ContractError::TicketNotFound)?;

        Ok(ticket.owner == owner && !ticket.is_used)
    }

    /// Returns the admin address.
    pub fn get_admin(env: Env) -> Result<Address, ContractError> {
        storage::get_admin(&env).ok_or(ContractError::NotInitialized)
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env, String};

    fn setup_env() -> (Env, Address, NFTTicketContractClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, NFTTicketContract);
        let client = NFTTicketContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin);

        (env, admin, client)
    }

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, NFTTicketContract);
        let client = NFTTicketContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin);

        assert_eq!(client.get_admin(), admin);
    }

    #[test]
    #[should_panic(expected = "Error(Contract, #2)")]
    fn test_double_initialize() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, NFTTicketContract);
        let client = NFTTicketContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin);
        client.initialize(&admin); // Should panic
    }

    #[test]
    fn test_create_event() {
        let (env, _admin, client) = setup_env();
        let organizer = Address::generate(&env);

        client.create_event(
            &organizer,
            &String::from_str(&env, "evt_1"),
            &String::from_str(&env, "Global Web3 Summit"),
            &String::from_str(&env, "August 15, 2026"),
            &String::from_str(&env, "Dubai, UAE"),
            &String::from_str(&env, "Conference"),
            &150_0000000, // 150 XLM in stroops
            &String::from_str(&env, "XLM"),
            &100,
        );

        let event = client.get_event(&String::from_str(&env, "evt_1"));
        assert_eq!(event.title, String::from_str(&env, "Global Web3 Summit"));
        assert_eq!(event.max_supply, 100);
        assert_eq!(event.minted_count, 0);
        assert!(event.is_active);
    }

    #[test]
    fn test_mint_ticket() {
        let (env, _admin, client) = setup_env();
        let organizer = Address::generate(&env);
        let attendee = Address::generate(&env);

        client.create_event(
            &organizer,
            &String::from_str(&env, "evt_1"),
            &String::from_str(&env, "Test Event"),
            &String::from_str(&env, "2026-08-15"),
            &String::from_str(&env, "Virtual"),
            &String::from_str(&env, "Workshop"),
            &50_0000000,
            &String::from_str(&env, "XLM"),
            &100,
        );

        let ticket_id = client.mint_ticket(&attendee, &String::from_str(&env, "evt_1"));
        assert_eq!(ticket_id, 1);

        let ticket = client.get_ticket(&ticket_id);
        assert_eq!(ticket.owner, attendee);
        assert!(!ticket.is_used);

        // Verify remaining tickets decremented
        let remaining = client.get_remaining_tickets(&String::from_str(&env, "evt_1"));
        assert_eq!(remaining, 99);
    }

    #[test]
    #[should_panic(expected = "Error(Contract, #8)")]
    fn test_duplicate_ticket() {
        let (env, _admin, client) = setup_env();
        let organizer = Address::generate(&env);
        let attendee = Address::generate(&env);

        client.create_event(
            &organizer,
            &String::from_str(&env, "evt_1"),
            &String::from_str(&env, "Test"),
            &String::from_str(&env, "2026"),
            &String::from_str(&env, "Online"),
            &String::from_str(&env, "Workshop"),
            &10,
            &String::from_str(&env, "XLM"),
            &50,
        );

        client.mint_ticket(&attendee, &String::from_str(&env, "evt_1"));
        client.mint_ticket(&attendee, &String::from_str(&env, "evt_1")); // Should panic
    }

    #[test]
    fn test_check_in() {
        let (env, _admin, client) = setup_env();
        let organizer = Address::generate(&env);
        let attendee = Address::generate(&env);

        client.create_event(
            &organizer,
            &String::from_str(&env, "evt_1"),
            &String::from_str(&env, "Test"),
            &String::from_str(&env, "2026"),
            &String::from_str(&env, "Venue"),
            &String::from_str(&env, "Conference"),
            &0,
            &String::from_str(&env, "XLM"),
            &10,
        );

        let ticket_id = client.mint_ticket(&attendee, &String::from_str(&env, "evt_1"));
        
        // Verify ticket is valid before check-in
        assert!(client.verify_ticket(&ticket_id, &attendee));
        
        // Check in
        client.check_in(&organizer, &ticket_id);

        // Verify ticket is now used
        let ticket = client.get_ticket(&ticket_id);
        assert!(ticket.is_used);
        assert!(!client.verify_ticket(&ticket_id, &attendee));
    }

    #[test]
    #[should_panic(expected = "Error(Contract, #10)")]
    fn test_double_check_in() {
        let (env, _admin, client) = setup_env();
        let organizer = Address::generate(&env);
        let attendee = Address::generate(&env);

        client.create_event(
            &organizer,
            &String::from_str(&env, "evt_1"),
            &String::from_str(&env, "Test"),
            &String::from_str(&env, "2026"),
            &String::from_str(&env, "Venue"),
            &String::from_str(&env, "Conference"),
            &0,
            &String::from_str(&env, "XLM"),
            &10,
        );

        let ticket_id = client.mint_ticket(&attendee, &String::from_str(&env, "evt_1"));
        client.check_in(&organizer, &ticket_id);
        client.check_in(&organizer, &ticket_id); // Should panic
    }

    #[test]
    fn test_deactivate_event() {
        let (env, _admin, client) = setup_env();
        let organizer = Address::generate(&env);

        client.create_event(
            &organizer,
            &String::from_str(&env, "evt_1"),
            &String::from_str(&env, "Test"),
            &String::from_str(&env, "2026"),
            &String::from_str(&env, "Online"),
            &String::from_str(&env, "Workshop"),
            &10,
            &String::from_str(&env, "XLM"),
            &50,
        );

        client.deactivate_event(&organizer, &String::from_str(&env, "evt_1"));
        let event = client.get_event(&String::from_str(&env, "evt_1"));
        assert!(!event.is_active);
    }

    #[test]
    #[should_panic(expected = "Error(Contract, #7)")]
    fn test_sold_out() {
        let (env, _admin, client) = setup_env();
        let organizer = Address::generate(&env);

        client.create_event(
            &organizer,
            &String::from_str(&env, "evt_1"),
            &String::from_str(&env, "Test"),
            &String::from_str(&env, "2026"),
            &String::from_str(&env, "Venue"),
            &String::from_str(&env, "Conference"),
            &0,
            &String::from_str(&env, "XLM"),
            &1, // Only 1 ticket
        );

        let attendee1 = Address::generate(&env);
        let attendee2 = Address::generate(&env);

        client.mint_ticket(&attendee1, &String::from_str(&env, "evt_1"));
        client.mint_ticket(&attendee2, &String::from_str(&env, "evt_1")); // Should panic
    }

    #[test]
    fn test_get_user_ticket() {
        let (env, _admin, client) = setup_env();
        let organizer = Address::generate(&env);
        let attendee = Address::generate(&env);

        client.create_event(
            &organizer,
            &String::from_str(&env, "evt_1"),
            &String::from_str(&env, "Test"),
            &String::from_str(&env, "2026"),
            &String::from_str(&env, "Online"),
            &String::from_str(&env, "Workshop"),
            &10,
            &String::from_str(&env, "XLM"),
            &50,
        );

        let ticket_id = client.mint_ticket(&attendee, &String::from_str(&env, "evt_1"));
        let found_id = client.get_user_ticket(&String::from_str(&env, "evt_1"), &attendee);
        assert_eq!(ticket_id, found_id);
    }
}
