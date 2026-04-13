const handlePurchase = async () => {
    if (accessState.loading) {
        // Don't allow purchase when loading
        return;
    }
    // Prefill with user email
    const userEmail = user.email; // assuming user object contains email
    // Proceed with the purchase logic
    // ... your purchase logic here ...
};