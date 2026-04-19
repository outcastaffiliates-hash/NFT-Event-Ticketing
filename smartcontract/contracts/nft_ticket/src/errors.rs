use soroban_sdk::contracterror;

/// Custom error codes for the NFT Ticket contract.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    /// The contract has not been initialized yet
    NotInitialized = 1,
    /// The contract has already been initialized
    AlreadyInitialized = 2,
    /// Caller is not authorized to perform this action
    Unauthorized = 3,
    /// Event with the given ID already exists
    EventAlreadyExists = 4,
    /// Event with the given ID was not found
    EventNotFound = 5,
    /// Event has been deactivated by its organizer
    EventNotActive = 6,
    /// All tickets for this event have been sold out
    SoldOut = 7,
    /// The attendee already holds a ticket for this event
    AlreadyOwnsTicket = 8,
    /// Ticket with the given ID was not found
    TicketNotFound = 9,
    /// Ticket has already been used for check-in
    TicketAlreadyUsed = 10,
    /// Ticket does not belong to the caller
    NotTicketOwner = 11,
    /// Invalid input parameter provided
    InvalidInput = 12,
}
