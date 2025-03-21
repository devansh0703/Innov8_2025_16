import os
import json
from datetime import datetime
from fastapi import FastAPI, HTTPException, Body, Query
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from pyngrok import ngrok
from supabase import create_client, Client
from web3 import Web3, HTTPProvider
from web3.middleware import geth_poa_middleware
import uvicorn
import asyncio

# -----------------------------
# Load Environment Variables
# -----------------------------
load_dotenv(".env")

# -----------------------------
# Ngrok Setup
# -----------------------------
NGROK_AUTH_TOKEN = os.getenv("NGROK_AUTH_TOKEN", "your-ngrok-auth-token-here")
ngrok.set_auth_token("2ubNVZ7hg4PJdY2Yi46Lf4WtEgX_3iD8bRgiXzoRU2MWL6gn")

# -----------------------------
# Supabase Setup
# -----------------------------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    raise Exception("Supabase credentials not set in environment variables")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# -----------------------------
# Web3 Setup - Sepolia Network
# -----------------------------
ALCHEMY_API_KEY = os.getenv("ALCHEMY_API_KEY")
alchemy_url = f"https://eth-sepolia.g.alchemy.com/v2/{ALCHEMY_API_KEY}"
w3 = Web3(HTTPProvider(alchemy_url))
w3.middleware_onion.inject(geth_poa_middleware, layer=0)
if not w3.is_connected():
    raise Exception("Failed to connect to Sepolia network")

# Load contract ABI
with open("ComplexEscrow.json", "r") as f:
    contract_artifact = json.load(f)
contract_abi = contract_artifact["abi"]

# Get contract address
DEPLOYED_CONTRACT_ADDRESS = os.getenv("DEPLOYED_CONTRACT_ADDRESS")
if not DEPLOYED_CONTRACT_ADDRESS:
    raise Exception("DEPLOYED_CONTRACT_ADDRESS not set in environment variables")
contract_address = Web3.to_checksum_address(DEPLOYED_CONTRACT_ADDRESS)
contract = w3.eth.contract(address=contract_address, abi=contract_abi)

# -----------------------------
# Private Key Mapping for Accounts
# -----------------------------
accounts_map = {}
for i in range(1, 5):
    pk = os.getenv(f"SEPOLIA_PRIVATE_KEY_{i}")
    if not pk:
        raise Exception(f"SEPOLIA_PRIVATE_KEY_{i} not set")
    acct = w3.eth.account.from_key(pk)
    accounts_map[acct.address.lower()] = pk

# -----------------------------
# Initialize FastAPI App
# -----------------------------
app = FastAPI(title="P2P Crypto Exchange Backend on Sepolia")

# -----------------------------
# Pydantic Models
# -----------------------------
class TradeRequest(BaseModel):
    buyer: str = Field(..., example="0xBuyerAddress")
    seller: str = Field(..., example="0xSellerAddress")
    amount_eth: float = Field(..., example=0.01)
    trade_type: str = Field(..., example="buy")

class TradeResponse(BaseModel):
    transaction_hash: str
    trade_details: dict

# -----------------------------
# API Endpoints
# -----------------------------
@app.post("/execute_trade", response_model=TradeResponse)
async def execute_trade(trade: TradeRequest = Body(...)):
    """Handles trade execution between buyer and seller on-chain."""
    try:
        buyer_addr = Web3.to_checksum_address(trade.buyer)
        seller_addr = Web3.to_checksum_address(trade.seller)

        buyer_pk = accounts_map.get(buyer_addr.lower())
        seller_pk = accounts_map.get(seller_addr.lower())
        if not buyer_pk or not seller_pk:
            raise HTTPException(status_code=400, detail="Private key missing for one of the parties")

        amountWei = w3.to_wei(trade.amount_eth, "ether")

        # Buyer confirms payment
        buyer_account = w3.eth.account.from_key(buyer_pk)
        tx1 = contract.functions.confirmPayment().build_transaction({
            "from": buyer_account.address,
            "nonce": w3.eth.get_transaction_count(buyer_account.address),
            "gas": 200000,
            "gasPrice": w3.to_wei("10", "gwei")
        })
        signed_tx1 = w3.eth.account.sign_transaction(tx1, private_key=buyer_pk)
        tx_hash1 = w3.eth.send_raw_transaction(signed_tx1.rawTransaction)
        w3.eth.wait_for_transaction_receipt(tx_hash1)

        # Seller confirms receipt
        seller_account = w3.eth.account.from_key(seller_pk)
        tx2 = contract.functions.confirmReceipt().build_transaction({
            "from": seller_account.address,
            "nonce": w3.eth.get_transaction_count(seller_account.address),
            "gas": 200000,
            "gasPrice": w3.to_wei("10", "gwei")
        })
        signed_tx2 = w3.eth.account.sign_transaction(tx2, private_key=seller_pk)
        tx_hash2 = w3.eth.send_raw_transaction(signed_tx2.rawTransaction)
        receipt2 = w3.eth.wait_for_transaction_receipt(tx_hash2)

        # Store trade details in Supabase
        trade_data = {
            "buyer": trade.buyer,
            "seller": trade.seller,
            "amount_eth": trade.amount_eth,
            "trade_type": trade.trade_type,
            "created_at": datetime.utcnow().isoformat()
        }
        db_response = supabase.table("trades").insert(trade_data).execute()
        if db_response.status_code not in [200, 201]:
            raise Exception(f"Error inserting data: {db_response.json()}")

        return TradeResponse(
            transaction_hash=tx_hash2.hex(),
            trade_details=trade_data
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/transactions")
async def get_transactions(wallet: str = Query(..., description="Wallet address to filter transactions")):
    """Fetch transaction history for a specific wallet."""
    try:
        response = supabase.table("trades").select("*").or_(f"buyer.eq.{wallet},seller.eq.{wallet}").execute()
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Error fetching transactions")
        return {"transactions": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/ping")
async def ping():
    """Health check endpoint."""
    return {"message": "Backend is running on Sepolia"}

if __name__ == "__main__":
    public_url = ngrok.connect(8000).public_url
    print(f" * ngrok tunnel: {public_url} -> http://127.0.0.1:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)

