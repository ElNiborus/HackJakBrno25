import iris
from sentence_transformers import SentenceTransformer

# Connect to InterSystems IRIS
conn = iris.connect("localhost", 32782, "DEMO", "_SYSTEM", "ISCDEMO")
cursor = conn.cursor()

# Initialize the sentence transformer model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Data to vectorise
query = "DATA TO VECTORISE"
query_vector = model.encode(query, normalize_embeddings=True, show_progress_bar=False).tolist()

# Insert into the table
table_name = "VectorSearch.DocRefVectors"
insert_query = f"""
INSERT INTO {table_name} (Data, DataVector)
VALUES (?, TO_VECTOR(?))
"""

cursor.execute(insert_query, [query, str(query_vector)])
conn.commit()

print(f"Successfully inserted data: '{query}'")
print(f"Vector dimension: {len(query_vector)}")

# Close connection
cursor.close()
conn.close()

