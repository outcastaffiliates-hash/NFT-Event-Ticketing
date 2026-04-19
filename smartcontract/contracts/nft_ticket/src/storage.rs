use soroban_sdk::{contracttype, Env, Address, String};

use crate::types::{Event, Ticket};

// ============================================================================
// Storage Keys
// ============================================================================

/// Keys for instance-level storage (shared contract state).
#[contracttype]
pub enum DataKey {
    /// The administrator address
    Admin,
    /// Global counter for auto-incrementing ticket IDs
    NextTicketId,
}

/// Keys for persistent storage (per-event data).
#[contracttype]
pub enum EventKey {
    /// Stores the Event struct, keyed by event_id
    Event(String),
}

/// Keys for persistent storage (per-ticket data).
#[contracttype]
pub enum TicketKey {
    /// Stores the Ticket struct, keyed by ticket_id
    Ticket(u64),
}

/// Composite key to enforce 1-ticket-per-user-per-event.
#[contracttype]
pub enum AttendeeKey {
    /// Maps (event_id, user_address) → ticket_id
    Owns(String, Address),
}

// ============================================================================
// Admin Storage
// ============================================================================

/// Stores the admin address in instance storage.
pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

/// Retrieves the admin address from instance storage.
pub fn get_admin(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Admin)
}

/// Checks if the admin has been set (contract initialized).
pub fn has_admin(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
}

// ============================================================================
// Ticket ID Counter
// ============================================================================

/// Gets the next available ticket ID and auto-increments it.
pub fn next_ticket_id(env: &Env) -> u64 {
    let id: u64 = env
        .storage()
        .instance()
        .get(&DataKey::NextTicketId)
        .unwrap_or(1);
    env.storage().instance().set(&DataKey::NextTicketId, &(id + 1));
    id
}

// ============================================================================
// Event Storage
// ============================================================================

/// Stores an event in persistent storage.
pub fn set_event(env: &Env, event: &Event) {
    let key = EventKey::Event(event.event_id.clone());
    env.storage().persistent().set(&key, event);
}

/// Retrieves an event from persistent storage.
pub fn get_event(env: &Env, event_id: &String) -> Option<Event> {
    let key = EventKey::Event(event_id.clone());
    env.storage().persistent().get(&key)
}

// ============================================================================
// Ticket Storage
// ============================================================================

/// Stores a ticket in persistent storage.
pub fn set_ticket(env: &Env, ticket: &Ticket) {
    let key = TicketKey::Ticket(ticket.ticket_id);
    env.storage().persistent().set(&key, ticket);
}

/// Retrieves a ticket from persistent storage.
pub fn get_ticket(env: &Env, ticket_id: u64) -> Option<Ticket> {
    let key = TicketKey::Ticket(ticket_id);
    env.storage().persistent().get(&key)
}

// ============================================================================
// Attendee Ownership Mapping
// ============================================================================

/// Records that a user owns a ticket for a specific event.
pub fn set_attendee_ticket(env: &Env, event_id: &String, owner: &Address, ticket_id: u64) {
    let key = AttendeeKey::Owns(event_id.clone(), owner.clone());
    env.storage().persistent().set(&key, &ticket_id);
}

/// Checks if a user already owns a ticket for a specific event.
pub fn get_attendee_ticket(env: &Env, event_id: &String, owner: &Address) -> Option<u64> {
    let key = AttendeeKey::Owns(event_id.clone(), owner.clone());
    env.storage().persistent().get(&key)
}
