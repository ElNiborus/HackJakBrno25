#!/usr/bin/env python3
"""
Script to delete the FN Brno vector database.
This allows re-ingestion with different settings (e.g., chunk length).
"""

import os
import sys
import logging
from pathlib import Path

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from iris_db import IRISVectorDB
from config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def delete_database():
    """
    Delete the vector database table and index.

    WARNING: This will permanently delete all ingested documents!
    """
    logger.info("Starting database deletion")

    db = IRISVectorDB()

    try:
        # Connect to database
        logger.info("Connecting to InterSystems IRIS...")
        db.connect()

        # Drop HNSW index if it exists
        logger.info("Dropping HNSW index...")
        try:
            db.cursor.execute("DROP INDEX HNSWIndex ON FNBrno.DocumentChunks")
            logger.info("✓ HNSW index dropped")
        except Exception as e:
            logger.warning(f"Could not drop index (may not exist): {e}")

        # Drop table if it exists
        logger.info("Dropping DocumentChunks table...")
        try:
            db.cursor.execute("DROP TABLE FNBrno.DocumentChunks")
            logger.info("✓ DocumentChunks table dropped")
        except Exception as e:
            logger.warning(f"Could not drop table (may not exist): {e}")

        # Commit changes
        db.conn.commit()

        logger.info("✓ Database deletion complete!")
        logger.info("You can now run ingest_data.py with new settings.")

    except Exception as e:
        logger.error(f"Error during database deletion: {e}")
        raise

    finally:
        db.disconnect()


if __name__ == "__main__":
    print("=" * 80)
    print("FN Brno Vector Database Deletion")
    print("=" * 80)
    print("\nWARNING: This will permanently delete all ingested documents!")
    print("You will need to re-run ingest_data.py to rebuild the database.\n")

    response = input("Are you sure you want to continue? (yes/no): ")

    if response.lower() in ['yes', 'y']:
        delete_database()
    else:
        print("Database deletion cancelled.")
        sys.exit(0)
