import fs from 'fs';
import path from 'path';

interface MCQ {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface CodingProblem {
  title: string;
  text: string;
  difficulty: string;
  codeTemplate: string;
  testCases: string;
  explanation: string;
  editorial: string;
  companyTags: string;
}

interface TopicData {
  name: string;
  description: string;
  learningObjectives: string;
  lessonContent: string;
  codeExample: string;
  timeComplexity: string;
  spaceComplexity: string;
  visualExplanation: string;
  interviewQuestions: string[];
  mcqs: MCQ[];
  coding?: CodingProblem;
}

interface SubjectData {
  name: string;
  description: string;
  topics: TopicData[];
}

interface ExamData {
  name: string;
  code: string;
  category: string;
  description: string;
  icon: string;
  subjects: SubjectData[];
}

function generateSyllabus() {
  const syllabus: ExamData[] = [];

  // ========================================================
  // TRACK 1: Google Cloud GenAI Certification (GOOGLE-GENAI)
  // ========================================================
  const genaiSubjects: SubjectData[] = [
    {
      name: 'NLP & Deep Learning Architectures',
      description: 'Foundations of sequence processing and transformer-based neural models.',
      topics: [
        {
          name: 'Deep Learning Foundations',
          description: 'Introduction to neural networks, backpropagation, and weights optimization.',
          learningObjectives: 'Understand standard neural nodes, activation functions, and gradient descent updates.',
          lessonContent: 'Deep Learning Foundations represent the base of modern generative models. A neural network is composed of layers of nodes (neurons), where each connection is governed by a weight parameter. Information flows forward through matrix multiplications and activations (like ReLU or GELU). Backpropagation calculates the partial derivatives of the loss function with respect to weights using the chain rule, enabling stochastic gradient descent (SGD) or Adam optimization updates.',
          codeExample: `import torch
import torch.nn as nn
import torch.optim as optim

# Define a simple multi-layer perceptron using PyTorch
class DeepLearningModel(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int, output_dim: int):
        super(DeepLearningModel, self).__init__()
        # Input layer to hidden layer
        self.layer1 = nn.Linear(input_dim, hidden_dim)
        # Activation function
        self.activation = nn.ReLU()
        # Hidden layer to output layer
        self.layer2 = nn.Linear(hidden_dim, output_dim)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        out = self.layer1(x)
        out = self.activation(out)
        out = self.layer2(out)
        return out

# Initialize network, loss criteria, and optimizer
model = DeepLearningModel(input_dim=10, hidden_dim=20, output_dim=2)
criterion = nn.MSELoss()
optimizer = optim.Adam(model.parameters(), lr=0.01)

# Forward pass simulation
dummy_input = torch.randn(1, 10)
dummy_target = torch.randn(1, 2)
output = model(dummy_input)
loss = criterion(output, dummy_target)

# Backpropagation step
optimizer.zero_grad()
loss.backward()
optimizer.step()
print("Forward and backward passes executed successfully using PyTorch.")`,
          timeComplexity: 'O(N * M) forward/backward weights matrix multiplication',
          spaceComplexity: 'O(W) parameters memory footprint',
          visualExplanation: 'Input Vector -> [ Weight Matrix 1 ] -> [ ReLU Activation ] -> [ Weight Matrix 2 ] -> Loss Estimation -> Backpropagation Feedback',
          interviewQuestions: [
            'What is gradient vanishing and how do activation functions like ReLU help?',
            'Explain the mathematical purpose of the chain rule in backpropagation.'
          ],
          mcqs: [
            {
              question: 'Which activation function is commonly used to prevent vanishing gradients in deep hidden layers?',
              options: ['Sigmoid', 'Tanh', 'Rectified Linear Unit (ReLU)', 'Step function'],
              correctIndex: 2,
              explanation: 'ReLU outputs a constant gradient of 1 for positive inputs, which prevents gradient values from shrinking exponentially.'
            }
          ]
        },
        {
          name: 'Attention Mechanisms',
          description: 'Syllabus covering self-attention calculations and scaling parameters.',
          learningObjectives: 'Learn details of dot-product attention, queries, keys, and values matrices.',
          lessonContent: 'Attention Mechanisms allow neural sequences to weigh tokens dynamically, assigning relational scores irrespective of linear distance. In self-attention, tokens are mapped to Query (Q), Key (K), and Value (V) matrices. The dot product of Queries and Keys computes semantic alignment weights, scaled by the square root of the dimension (d_k) to prevent exploding values. Softmax normalization creates an attention distribution matrix, which is multiplied by the Values to compute the output context vectors.',
          codeExample: `import torch
import torch.nn.functional as F

def scaled_dot_product_attention(query: torch.Tensor, key: torch.Tensor, value: torch.Tensor) -> torch.Tensor:
    # Get dimension size of keys
    d_k = query.size(-1)
    # Calculate score metrics by matrix multiplication of Q and K transposed
    scores = torch.matmul(query, key.transpose(-2, -1)) / torch.sqrt(torch.tensor(d_k, dtype=torch.float32))
    # Softmax normalization across final dimension
    attention_weights = F.softmax(scores, dim=-1)
    # Multiply weight distribution by Value matrix
    context_vector = torch.matmul(attention_weights, value)
    return context_vector

# Test sample inputs representing sequence length 3, dim 4
q = torch.randn(1, 3, 4)
k = torch.randn(1, 3, 4)
v = torch.randn(1, 3, 4)
out = scaled_dot_product_attention(q, k, v)
print("Context vectors compiled successfully using Scaled Dot Product Attention.")`,
          timeComplexity: 'O(L^2 * D) where L is sequence length',
          spaceComplexity: 'O(L^2) attention distribution weights cache',
          visualExplanation: 'Queries * Keys^T -> Scale [1 / sqrt(d_k)] -> Softmax Norm -> Attention Map -> Map * Values -> Context Output',
          interviewQuestions: [
            'Why is scaled dot-product attention scaled by the square root of the key dimension?',
            'What is the difference between Self-Attention and Cross-Attention?'
          ],
          mcqs: [
            {
              question: 'What is the mathematical scaling factor in Dot-Product Attention representing query dimension d_k?',
              options: ['d_k', '1 / d_k', '1 / sqrt(d_k)', 'sqrt(d_k)'],
              correctIndex: 2,
              explanation: 'Scaling by 1/sqrt(d_k) keeps the dot product values from growing too large in high dimensions, preventing softmax gradients from vanishing.'
            }
          ]
        },
        {
          name: 'BERT vs. GPT Architecture',
          description: 'Comparing encoder-only bidirectional representations with decoder-only autoregressive generation.',
          learningObjectives: 'Define the architectural differences between Masked Language Modeling and Causal Masking.',
          lessonContent: 'BERT vs GPT Architecture contrasts two key transformer paradigms. BERT (Bidirectional Encoder Representations from Transformers) is an encoder-only model that processes text bidirectionally, masking tokens to learn left-to-right and right-to-left contexts simultaneously (Masked Language Modeling). GPT (Generative Pre-trained Transformer) is a decoder-only model that processes text autoregressively, employing causal masking to prevent the model from seeing future tokens, making it optimized for next-token generation.',
          codeExample: `from transformers import AutoTokenizer, AutoModelForMaskedLM, AutoModelForCausalLM
import torch

# Load a bidirectional model (BERT-like)
bidirectional_tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")
bidirectional_model = AutoModelForMaskedLM.from_pretrained("bert-base-uncased")

# Load a causal autoregressive model (GPT-like)
causal_tokenizer = AutoTokenizer.from_pretrained("gpt2")
# Set padding token
causal_tokenizer.pad_token = causal_tokenizer.eos_token
causal_model = AutoModelForCausalLM.from_pretrained("gpt2")

print("Bidirectional Encoder and Causal Autoregressive Decoders initialized successfully.")`,
          timeComplexity: 'O(N) encoding passes vs sequential O(L) autoregressive generation loops',
          spaceComplexity: 'O(P) model parameter parameters',
          visualExplanation: 'BERT: Input -> Multi-Directional Encoder Layers -> Output representation (NLP Task)\nGPT: Input -> Causal Masked Decoder Layers -> Autoregressive Next-Token prediction',
          interviewQuestions: [
            'Explain how causal masking functions in GPT decoders.',
            'Under what scenarios is BERT superior to GPT?'
          ],
          mcqs: [
            {
              question: 'Which transformer component prevents causal GPT models from accessing future tokens during self-attention calculations?',
              options: ['Positional Encoding', 'Causal Masking Matrix', 'Layer Normalization', 'Residual connections'],
              correctIndex: 1,
              explanation: 'A causal mask replaces scores for future positions with negative infinity before the softmax calculation, ensuring token predictions depend only on past contexts.'
            }
          ]
        },
        {
          name: 'Vertex AI deployment',
          description: 'Deploying custom large language models on Google Vertex AI end-to-end.',
          learningObjectives: 'Learn how to register model artifacts and deploy them to Vertex Endpoints.',
          lessonContent: 'Vertex AI Deployment allows engineers to upload trained model parameters, register them in the Vertex Model Registry, and configure regional CPU/GPU endpoints for low-latency online serving. The model configuration requires packaging artifacts, configuring startup serving hooks, and mapping traffic parameters using the Google Cloud SDK.',
          codeExample: `# Python configuration representation simulating Vertex AI Custom Endpoint Deploy
# from google.cloud import aiplatform
# aiplatform.init(project="my-project", location="us-central1")
# model = aiplatform.Model.upload(
#     display_name="genai-model",
#     artifact_uri="gs://my-bucket/model-artifacts/",
#     serving_container_image_uri="us-docker.pkg.dev/vertex-ai/prediction/pytorch-cpu.2-0:latest"
# )
# endpoint = model.deploy(machine_type="n1-standard-4")
print("Vertex AI deployment pipeline script structure defined.")`,
          timeComplexity: 'O(1) regional API deployment trigger',
          spaceComplexity: 'O(R) compute node resources allocations',
          visualExplanation: 'Model Registry -> Register Container -> Deploy to Endpoint -> Client REST API requests',
          interviewQuestions: [
            'How do you upload a PyTorch model to Google Vertex Model Registry?',
            'What is the purpose of a serving container in cloud endpoints?'
          ],
          mcqs: [
            {
              question: 'Which Vertex AI registry is used to catalog and version model artifacts before deployment?',
              options: ['Vertex Dataset Registry', 'Vertex Feature Store', 'Vertex Model Registry', 'Google Container Registry'],
              correctIndex: 2,
              explanation: 'The Vertex Model Registry catalogs, versions, and manages model artifacts for deployment.'
            }
          ]
        }
      ]
    }
  ];

  syllabus.push({
    name: 'Google Cloud GenAI Certification',
    code: 'GOOGLE-GENAI',
    category: 'Tech Certifications',
    description: 'Master deep learning foundations, attention mechanics, encoder/decoder transformer architectures, and Vertex AI deployments.',
    icon: 'Globe',
    subjects: genaiSubjects
  });

  // ========================================================
  // TRACK 2: AWS Solutions Architect Associate (AWS-SAA)
  // ========================================================
  const awsSubjects: SubjectData[] = [
    {
      name: 'AWS Architecture & Secure Infrastructure',
      description: 'Designing highly resilient VPC networks, serverless compute, and tiered storage.',
      topics: [
        {
          name: 'VPC Networking',
          description: 'Designing subnets, Route Tables, Internet Gateways, NAT Gateways, and Security Groups.',
          learningObjectives: 'Configure isolation boundaries using public/private subnets and route mappings.',
          lessonContent: 'Virtual Private Cloud (VPC) Networking is the foundational network isolation framework on AWS. System architects divide VPC CIDR blocks into Public and Private subnets. A Public subnet has a Route Table entry pointing to an Internet Gateway (IGW). Private subnets route outbound internet traffic through a NAT Gateway located in a Public subnet. Security Groups act as stateful firewalls at the instance level, while Network Access Control Lists (NACLs) act as stateless boundaries at the subnet level.',
          codeExample: `import boto3

# Initialize EC2 resource client using Boto3
ec2 = boto3.client('ec2', region_name='us-east-1')

def create_vpc_network():
    # Provision a VPC network with CIDR block
    vpc_response = ec2.create_vpc(CidrBlock='10.0.0.0/16')
    vpc_id = vpc_response['Vpc']['VpcId']
    
    # Enable DNS support parameters
    ec2.modify_vpc_attribute(VpcId=vpc_id, EnableDnsSupport={'Value': True})
    ec2.modify_vpc_attribute(VpcId=vpc_id, EnableDnsHostnames={'Value': True})
    
    print(f"VPC network created successfully with ID: {vpc_id}")
    return vpc_id

# Run simulation
# vpc_id = create_vpc_network()
print("AWS VPC creation network script defined using Boto3.")`,
          timeComplexity: 'O(1) AWS VPC API configuration latency',
          spaceComplexity: 'O(S) subnets CIDR block allocations',
          visualExplanation: 'VPC [ 10.0.0.0/16 ] -> Public Subnet [ Route -> IGW ] -> Private Subnet [ Route -> NAT Gateway ]',
          interviewQuestions: [
            'Explain the stateful differences between Security Groups and NACLs.',
            'Why must a NAT Gateway be deployed inside a Public subnet?'
          ],
          mcqs: [
            {
              question: 'Which subnet route configuration is required to classify an AWS subnet as a Public subnet?',
              options: ['A route pointing to a NAT Gateway', 'A route pointing to an Elastic IP', 'A route pointing to an Internet Gateway (IGW)', 'A private virtual gateway mapping'],
              correctIndex: 2,
              explanation: 'A subnet is public only when its route table has a destination block pointing to the Internet Gateway (IGW).'
            }
          ]
        },
        {
          name: 'Multi-AZ High Availability',
          description: 'Deploying resources across multiple Availability Zones with Auto Scaling and ELB.',
          learningObjectives: 'Design fault-tolerant architectures utilizing regional load balancers and target groups.',
          lessonContent: 'Multi-AZ High Availability ensures that systems survive datacenter outages without interruption. Architects deploy Elastic Load Balancers (ELBs) to distribute traffic across EC2 instances spanning multiple Availability Zones. Auto Scaling Groups (ASGs) dynamically scale instances based on CPU utilization, pulling from private subnets across multiple AZs. RDS databases are deployed with a synchronous standby instance in a secondary AZ for automatic failover.',
          codeExample: `import boto3

# Initialize Auto Scaling client using Boto3
autoscaling = boto3.client('autoscaling', region_name='us-east-1')

def configure_auto_scaling(asg_name: str, launch_template_id: str, subnets: list):
    # Configure an Auto Scaling Group across multiple private subnet zones
    # response = autoscaling.create_auto_scaling_group(
    #     AutoScalingGroupName=asg_name,
    #     LaunchTemplate={'LaunchTemplateId': launch_template_id, 'Version': '$Latest'},
    #     MinSize=2,
    #     MaxSize=5,
    #     DesiredCapacity=2,
    #     VPCZoneIdentifier=','.join(subnets)
    # )
    print(f"Auto Scaling Group '{asg_name}' configuration structure defined.")

print("High Availability Auto Scaling scripts defined.")`,
          timeComplexity: 'O(1) Auto Scaling configuration script creation',
          spaceComplexity: 'O(N) virtual machines running configurations scale parameters',
          visualExplanation: 'ELB (Elastic Load Balancer) -> Distribute traffic -> Subnet AZ-A (EC2) / Subnet AZ-B (EC2)',
          interviewQuestions: [
            'How does synchronous standby failover function in Multi-AZ RDS deployments?',
            'What is the difference between High Availability and Fault Tolerance?'
          ],
          mcqs: [
            {
              question: 'Which AWS database configuration provides synchronous standby replicas in a different Availability Zone for automated recovery?',
              options: ['RDS Read Replicas', 'RDS Multi-AZ Deployment', 'DynamoDB Global Tables', 'Aurora Serverless Global cluster'],
              correctIndex: 1,
              explanation: 'RDS Multi-AZ provisions a synchronous standby replica in a separate Availability Zone, providing automatic failover.'
            }
          ]
        },
        {
          name: 'Serverless Architecture (Lambda/API Gateway)',
          description: 'Building event-driven microservices with AWS Lambda, API Gateway, and DynamoDB.',
          learningObjectives: 'Configure HTTP API endpoints triggering Python-based serverless runtimes.',
          lessonContent: 'Serverless Architecture allows developers to run application scripts without managing server nodes. AWS API Gateway receives REST/HTTP calls and routes them directly to AWS Lambda functions. Lambda functions execute code inside micro-containers that scale dynamically to handle requests, billing only for compute execution seconds. Data is persisted in AWS DynamoDB, a fully managed NoSQL database.',
          codeExample: `import json

# Standard lambda handler function in Python
def lambda_handler(event, context):
    # Extract path parameters from incoming HTTP request
    try:
      path_params = event.get('pathParameters', {})
      item_id = path_params.get('id', 'default')
      
      # Build HTTP response payload
      response_body = {
          "message": f"Serverless payload retrieved successfully for ID: {item_id}",
          "status": "active"
      }
      
      return {
          "statusCode": 200,
          "headers": {
              "Content-Type": "application/json"
          },
          "body": json.dumps(response_body)
      }
    except Exception as e:
      return {
          "statusCode": 500,
          "body": json.dumps({"error": str(e)})
      }

print("AWS Lambda handler template validated.")`,
          timeComplexity: 'O(1) millisecond execution scaling response latency',
          spaceComplexity: 'O(M) memory allocations size (128MB to 10GB range)',
          visualExplanation: 'Client -> HTTP/REST Request -> API Gateway -> Lambda Trigger -> DynamoDB Lookup',
          interviewQuestions: [
            'Explain Lambda cold starts and how to mitigate them.',
            'What is the role of API Gateway in event-driven serverless architectures?'
          ],
          mcqs: [
            {
              question: 'Which serverless compute engine charges strictly for memory allocated and milliseconds of execution time?',
              options: ['Amazon EC2', 'Amazon Elastic Beanstalk', 'AWS Fargate', 'AWS Lambda'],
              correctIndex: 3,
              explanation: 'AWS Lambda runs serverless containers on-demand, charging only for active execution milliseconds and memory.'
            }
          ]
        },
        {
          name: 'Storage Tiering (S3/EBS/EFS)',
          description: 'AWS storage classes, instance block storage, and regional shared file systems.',
          learningObjectives: 'Select optimal storage classes based on access patterns, retrieval latency, and costs.',
          lessonContent: 'Storage Tiering allows architects to optimize S3 costs by moving data across tiers: Standard -> Infrequent Access (IA) -> Glacier. Elastic Block Store (EBS) provides low-latency block storage for a single EC2 instance within an AZ. Elastic File System (EFS) provides a shared POSIX file system that can be mounted simultaneously by hundreds of EC2 instances across multiple Availability Zones.',
          codeExample: `import boto3

# Initialize S3 client using Boto3
s3 = boto3.client('s3', region_name='us-east-1')

def upload_and_tier_file(bucket_name: str, file_path: str, key_name: str):
    # Upload file with S3 Standard-IA (Infrequent Access) storage tiering configuration
    # s3.upload_file(
    #     Filename=file_path,
    #     Bucket=bucket_name,
    #     Key=key_name,
    #     ExtraArgs={'StorageClass': 'STANDARD_IA'}
    # )
    print("S3 IA upload configurations completed.")

print("Storage configurations active.")`,
          timeComplexity: 'O(1) API S3 configuration upload request',
          spaceComplexity: 'O(U) unlimited S3 storage allocations capability',
          visualExplanation: 'EC2 Instance-A (AZ-1) \\ \nEC2 Instance-B (AZ-2)  - [ Mount Shared EFS File System ]\nEC2 Instance-C (AZ-3) /',
          interviewQuestions: [
            'Compare the access capabilities of EBS vs. EFS.',
            'Explain how S3 Lifecycle policies optimize enterprise cloud costs.'
          ],
          mcqs: [
            {
              question: 'Which AWS storage service provides a POSIX shared file system that can be mounted simultaneously by instances across multiple AZs?',
              options: ['Amazon EBS', 'Amazon S3', 'Amazon Elastic File System (EFS)', 'Amazon Glacier'],
              correctIndex: 2,
              explanation: 'Amazon EFS is a shared, regional network file system that supports multi-instance mounts across different Availability Zones.'
            }
          ]
        }
      ]
    }
  ];

  syllabus.push({
    name: 'AWS Solutions Architect Associate (SAA-C03)',
    code: 'AWS-SAA',
    category: 'Tech Certifications',
    description: 'Design highly available, secure, and cost-optimized infrastructure on AWS. Master VPCs, serverless compute, and regional file systems.',
    icon: 'Cloud',
    subjects: awsSubjects
  });

  // ========================================================
  // TRACK 3: AI Engineering & RAG Foundations (AI-RAG)
  // ========================================================
  const ragSubjects: SubjectData[] = [
    {
      name: 'Semantic Retrieval & Vector Pipelines',
      description: 'Building grounded pipelines using document parsers and embeddings matching.',
      topics: [
        {
          name: 'Vector Databases',
          description: 'Indexing, querying, and storing high-dimensional vector embeddings.',
          learningObjectives: 'Learn how vector databases perform nearest neighbor searches (cosine similarity).',
          lessonContent: 'Vector Databases store representations of unstructured data as high-dimensional floats. Traditional relational databases query structured fields using indices; vector databases perform search by comparing vector geometries. They use algorithms like Hierarchical Navigable Small World (HNSW) to perform Approximate Nearest Neighbor (ANN) search, returning matches based on cosine similarity or Euclidean distance metrics.',
          codeExample: `import numpy as np

def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
    # Compute dot product
    dot_prod = np.dot(v1, v2)
    # Compute magnitudes
    norm_v1 = np.linalg.norm(v1)
    # Compute magnitudes
    norm_v2 = np.linalg.norm(v2)
    # Return similarity index
    return float(dot_prod / (norm_v1 * norm_v2) if norm_v1 > 0 and norm_v2 > 0 else 0.0)

# Simulate vector lookup against query
query_vector = np.array([0.1, 0.9, -0.3])
item_vector = np.array([0.15, 0.85, -0.28])
similarity = cosine_similarity(query_vector, item_vector)
print(f"Cosine Similarity calculation output: {similarity:.4f}")`,
          timeComplexity: 'O(D * N) exact search vs O(log N) approximate index queries',
          spaceComplexity: 'O(N * D) float float arrays memory footprint',
          visualExplanation: 'Unstructured Data -> Embeddings Model -> High-Dimensional Vector Space -> Distance Search',
          interviewQuestions: [
            'Explain how HNSW index partitioning optimizes search times in vector databases.',
            'What is the difference between cosine similarity and dot product similarity?'
          ],
          mcqs: [
            {
              question: 'Which mathematical calculation is used to determine semantic similarity between vectors by computing the normalized dot product?',
              options: ['Euclidean Distance', 'Cosine Similarity', 'Manhattan Distance', 'Hamming distance'],
              correctIndex: 1,
              explanation: 'Cosine similarity calculates the cosine of the angle between two vectors, measuring semantic alignment irrespective of magnitude.'
            }
          ]
        },
        {
          name: 'Document Chunking Strategies',
          description: 'Splitting long text sources into contextually complete paragraphs.',
          learningObjectives: 'Select chunk sizes and overlap margins to balance retrieval context vs. model limits.',
          lessonContent: 'Document Chunking Strategies partition long-form documents into smaller, coherent text segments. Basic fixed-size chunking splits text strictly by character count, often cutting off sentences in the middle. Recursive character chunking uses separators like newlines and sentences to maintain context. Overlaps (e.g., 10-20% margin) are added between chunks to prevent key concepts from being cut in half.',
          codeExample: `def split_text_recursive(text: string, chunk_size: int, overlap: int) -> list:
    # A simple sliding window recursive text chunker
    chunks = []
    start = 0
    text_len = len(text)
    
    while start < text_len:
        # Define end boundary
        end = min(start + chunk_size, text_len)
        # Extract paragraph chunk
        chunk = text[start:end]
        chunks.append(chunk)
        # Advance by size minus overlap margin
        start += chunk_size - overlap
    return chunks

# Test sample inputs
doc = "This represents a long document that will be parsed by RAG chunking strategies."
result = split_text_recursive(doc, chunk_size=20, overlap=5)
print(f"Text divided into {len(result)} overlapping chunks.")`,
          timeComplexity: 'O(C) linear character processing traversal',
          spaceComplexity: 'O(N) storage array segments',
          visualExplanation: 'Raw Document -> [ Chunk size: 200 chars ] -> [ Overlap: 50 chars ] -> Embedding pipeline',
          interviewQuestions: [
            'How do you choose the optimal chunk size for a RAG application?',
            'What are the dangers of zero overlap margins in text chunking?'
          ],
          mcqs: [
            {
              question: 'What is the purpose of adding an overlap margin between adjacent text chunks?',
              options: ['To speed up vector indexing', 'To prevent semantic concepts from being split in half', 'To compress embedding dimensional space', 'To remove stop words from text'],
              correctIndex: 1,
              explanation: 'Overlaps preserve continuity, ensuring that context split across boundary boundaries remains retrievable.'
            }
          ]
        },
        {
          name: 'Embedding Models',
          description: 'Converting words, sentences, and documents into low-latency dense vector representations.',
          learningObjectives: 'Understand standard models, mapping input tokens to coordinates.',
          lessonContent: 'Embedding Models are deep learning models trained to map tokens, sentences, or images into high-dimensional coordinate spaces (e.g., 768 or 1536 floats). Tokens with similar semantic meanings are placed closer together in this space. Models like SentenceTransformers or OpenAI text-embedding-ada-002 process input sequences to output dense vector arrays.',
          codeExample: `# Python representation of embedding creation
# from sentence_transformers import SentenceTransformer
# model = SentenceTransformer('all-MiniLM-L6-v2')
# embeddings = model.encode(["Vector databases are scalable"])
print("Embedding generator representation compiled.")`,
          timeComplexity: 'O(L) model model inference processing passes',
          spaceComplexity: 'O(D) dense dimension coordinates vectors',
          visualExplanation: 'Token Sequence -> [ Embedding Neural Layers ] -> [ Float Coordinate Array ]',
          interviewQuestions: [
            'What are dense embeddings vs. sparse embeddings?',
            'Explain how out-of-vocabulary tokens are handled by modern tokenizer models.'
          ],
          mcqs: [
            {
              question: 'What is the standard coordinate array dimension size outputted by open source sentence embedding models like all-MiniLM-L6-v2?',
              options: ['32 float coordinates', '384 float coordinates', '4096 float coordinates', '100 float coordinates'],
              correctIndex: 1,
              explanation: 'MiniLM outputs dense embeddings with 384 dimensional coordinates, balancing retrieval speed and accuracy.'
            }
          ]
        },
        {
          name: 'Retrieval-Augmented Generation pipelines',
          description: 'End-to-end grounded query response pipelines using vector indexes and LLMs.',
          learningObjectives: 'Construct a pipeline combining RAG searches, context matching, and LLMs.',
          lessonContent: 'Retrieval-Augmented Generation (RAG) pipelines combine vector retrieval with large language models to provide accurate, grounded responses. The pipeline follows a strict execution flow: 1. User inputs a query. 2. The query is converted into a vector embedding. 3. The vector database retrieves the top-K relevant chunks. 4. The chunks are formatted into a system prompt. 5. The LLM generates a response strictly from this context.',
          codeExample: `class RAGPipeline:
    def __init__(self, vector_store: dict, llm_fn):
        self.vector_store = vector_store
        self.llm = llm_fn

    def retrieve_and_generate(self, query: str) -> str:
        # Retrieve context matching query key
        context = self.vector_store.get(query, "No matching context found.")
        
        # Construct system prompt
        prompt = f"Answer using this context only: {context}\\nQuery: {query}"
        
        # Get grounded response
        return self.llm(prompt)

# Simulate setup
pipeline = RAGPipeline({"subnet type": "Public subnet points to IGW"}, lambda p: f"Grounded Output based on: {p}")
res = pipeline.retrieve_and_generate("subnet type")
print(res)`,
          timeComplexity: 'O(R + G) where R is search and G is inference latency',
          spaceComplexity: 'O(C) context length limitations constraints',
          visualExplanation: 'User Query -> Vector Index Lookup -> Context Injection -> LLM Prompts -> Grounded Answer',
          interviewQuestions: [
            'What are the primary mitigation strategies for hallucinations in RAG?',
            'Explain how metadata filtering functions in vector query stages.'
          ],
          mcqs: [
            {
              question: 'Which pipeline component provides the external source of truth context to the LLM during RAG generation?',
              options: ['Pre-training corpus', 'Fine-tuning dataset', 'Vector Database Retriever', 'Token decoders'],
              correctIndex: 2,
              explanation: 'The vector database retriever fetches relevant document chunks matching the query, grounding the LLM in real data.'
            }
          ]
        }
      ]
    }
  ];

  syllabus.push({
    name: 'AI Engineering & RAG Foundations',
    code: 'AI-RAG',
    category: 'Placement Prep',
    description: 'Master semantic retrieval, document chunking parameters, embedding coordinates vector models, and RAG architectures.',
    icon: 'Code',
    subjects: ragSubjects
  });

  // Ensure directories exist
  const kbDir = path.join(process.cwd(), 'knowledge_base');
  if (!fs.existsSync(kbDir)) {
    fs.mkdirSync(kbDir);
  }

  const outPath = path.join(kbDir, 'syllabus.json');
  fs.writeFileSync(outPath, JSON.stringify(syllabus, null, 2));
  console.log(`Generated syllabus database: ${outPath}`);
}

generateSyllabus();
