use soroban_sdk::{contracttype, Address, String};

/// Represents an event registered on the platform.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Event {
    /// Unique identifier for the event (e.g., "evt_1")
    pub event_id: String,
    /// Human-readable event title
    pub title: String,
    /// Event date as a string (e.g., "August 15, 2026")
    pub date: String,
    /// Event venue / location description
    pub location: String,
    /// Category tag (Conference, Workshop, Exhibition, etc.)
    pub category: String,
    /// Ticket price in stroops (1 XLM = 10,000,000 stroops)
    pub price: u64,
    /// Currency symbol for the ticket price
    pub currency: String,
    /// The organizer / admin who created this event
    pub organizer: Address,
    /// Maximum number of tickets available
    pub max_supply: u32,
    /// Number of tickets minted so far
    pub minted_count: u32,
    /// Whether the event is currently active
    pub is_active: bool,
}

/// Represents a single NFT ticket minted to an attendee.
#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Ticket {
    /// Auto-incremented ticket ID (globally unique)
    pub ticket_id: u64,
    /// The event this ticket belongs to
    pub event_id: String,
    /// The wallet address this ticket is bound to (soulbound)
    pub owner: Address,
    /// Timestamp of when the ticket was minted (ledger timestamp)
    pub minted_at: u64,
    /// Whether this ticket has been used for check-in
    pub is_used: bool,
}
