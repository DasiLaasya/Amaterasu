# Knowledge Base: Google Generative AI Certification Guide

This document contains grounded, official syllabus material for Google Generative AI certifications, covering Large Language Models (LLMs), Transformer Architecture, Prompt Engineering, and Retrieval-Augmented Generation (RAG).

---

## 1. Large Language Models (LLMs) & Deep Learning
Large Language Models are deep learning models trained on massive text datasets to predict the next token in a sequence.
- **Pre-training**: The model learns syntax, semantics, and general facts about the world by predicting masked tokens (self-supervised learning).
- **Fine-Tuning / Alignment**: Adapting the pre-trained base model to follow specific instructions (SFT - Supervised Fine-Tuning) and align with human preferences using RLHF (Reinforcement Learning from Human Feedback) or DPO (Direct Preference Optimization).
- **Tokens**: The basic units of text processed by an LLM. A token is roughly 4 characters or 0.75 words in English.

---

## 2. The Transformer Architecture
Introduced in the paper *"Attention Is All You Need"* (Vaswani et al., 2017), the Transformer architecture replaced recurrent neural networks (RNNs) and LSTMs with parallelizable self-attention mechanisms.

### Self-Attention Formula
Self-attention calculates the relationship between words in a sequence by projecting input embeddings into three vectors: Query ($Q$), Key ($K$), and Value ($V$).
$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V$$
Where:
- $QK^T$ measures the similarity between queries and keys.
- $\sqrt{d_k}$ is the scaling factor based on the dimension of keys to prevent gradients from exploding/vanishing in the softmax function.
- $\text{softmax}$ outputs attention weights, which are multiplied by Value $V$.

### Multi-Head Attention
Instead of performing a single attention function, Transformers project $Q$, $K$, and $V$ vectors into multiple subspaces (heads) in parallel, allowing the model to attend to information from different representation subspaces simultaneously.

---

## 3. Prompt Engineering Techniques
Prompt engineering is the process of structuring input queries to maximize the accuracy and relevance of LLM generations.
- **Zero-Shot Prompting**: Asking the model to perform a task without giving any examples.
- **Few-Shot Prompting**: Providing a few input-output examples in the prompt before the final instruction.
- **Chain-of-Thought (CoT)**: Instructing the model to output its step-by-step reasoning process (e.g. "Let's think step by step") before generating the final answer. This significantly improves reasoning on arithmetic and logic.
- **System Instructions**: Hardcoded system parameters that define the persona, rules, boundaries, and tone of the assistant (e.g. "You are a professional software engineer...").

---

## 4. Retrieval-Augmented Generation (RAG)
RAG is a framework that improves LLM outputs by retrieving relevant documents from an external knowledge base and passing them as context inside the model's prompt window.

### RAG Workflow Steps:
1. **Ingestion**: Documents are split into overlapping blocks (chunking, e.g. 512 tokens).
2. **Embedding**: Chunks are converted into dense vector representations using an embedding model.
3. **Indexing**: Vectors are stored in a specialized database (Vector DB).
4. **Retrieval**: At query time, the user's prompt is embedded, and a similarity search (like Cosine Similarity) fetches the top-K matching document chunks.
5. **Generation**: The fetched chunks are injected into the LLM prompt template as grounding context alongside the original user query.

---

## Official Resource References
- **Google Cloud AI**: [Google Cloud GenAI Overview](https://cloud.google.com/generative-ai)
- **GeeksForGeeks**: [Transformer Neural Networks Guide](https://www.geeksforgeeks.org/transformer-neural-networks-in-deep-learning/)
- **Hugging Face**: [NLP Course - Transformers](https://huggingface.co/learn/nlp-course)
