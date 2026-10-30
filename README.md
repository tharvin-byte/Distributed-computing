# Python Hadoop MapReduce Market Basket Analysis

Market basket analysis using Hadoop MapReduce and Python Hadoop Streaming.

The Hadoop cluster is the primary execution target. The mapper and reducer are
stateless workers, and `src/hadoop_apriori.py` is the driver that submits the
sequential Apriori passes required by the algorithm.

This repository contains the [code](https://github.com/BurraAbhishek/Python_Hadoop_MapReduce_MarketBasketAnalysis/tree/main/src) which finds the most frequently occurring item(set)s from a given list of transactions. In addition to that, this repository also contains a [dataset generator](https://github.com/BurraAbhishek/Python_Hadoop_MapReduce_MarketBasketAnalysis/tree/main/dataset_generator) which generates JSON and CSV datasets for [affinity analysis](https://en.wikipedia.org/wiki/Affinity_analysis).

## Acknowledgements
I wish to express my sincere thanks and deep sense of gratitude to my project guide, Dr. Bharadwaja Kumar, Professor, SCSE, for his consistent encouragement and valuable guidance offered to me in a pleasant manner throughout the course of the project work. I are extremely grateful to the Dean of the SCOPE, VIT Chennai, for extending the facilities of the School towards my project and for the unstinting support. 

I also take this opportunity to thank all the faculty of the School for their support and their wisdom imparted to us throughout the course. 

I thank our parents, family, and friends for bearing with us throughout the course of our project and for the opportunity they provided us in undergoing this course in such a prestigious institution. 

I would also like to thank [SSaikia_JtheRocker](https://stackoverflow.com/users/633970/ssaikia_jtherocker) for his [answer](https://stackoverflow.com/a/18562328)
 in Stack Overflow which helped me in executing the code for k-pass algorithm.

## Description:
Frequent itemset mining is generally used in retail stores to determine the likelihood of customers buying a given set of items. Retail store owners can maximize their profits if they have more stocks of frequently bought items and itemsets. It works by determining the frequency of purchasing an item or a set of items across various transactions.

Hadoop MapReduce is designed to process big data by splitting large files into blocks and splitting them across nodes in a cluster. The data is processed through the nodes in parallel. MapReduce algorithms are generally faster than conventional supercomputing models due to the advantage of data locality, where individual nodes process the data stored in them. Conventional supercomputing, in contrast, relies on high-speed networking. In a MapReduce program, the map function converts a given data into a set of <key, value> pairs and the reduce function converts the output of the mapper (the <key, value> pairs) into a collection of values.

Hadoop Streaming is included by default in Hadoop distributions. It allows developers to write MapReduce code in various programming languages without being forced to write only Java code to run MapReduce programs. Hadoop Streaming relies on streaming of big data and processing of data using the traditional command-prompt interface (STDIN and STDOUT).

The Apriori algorithm is a multi-pass algorithm. This poses some challenges to conventional Java-based MapReduce programs and bigger challenges to using the streaming MapReduce programs. In a conventional Java MapReduce program, multi-pass algorithms can be configured in the driver program. In streaming MapReduce programs, there is no concept of driver programs. Therefore, we have to run all the passes manually and sequentially. In addition to that, writing configurations and reading from them doesn’t work using the Hadoop Streaming utility. Therefore, additional scripts that write configuration changes are required in addition to the MapReduce code. On Linux, this can be automated because Linux can natively run shell scripts (.sh files). 


## Interactive Web Application

An interactive web dashboard (FastAPI + React 18 / Tailwind CSS) is available to run and visualize market basket analysis without typing terminal commands:

1. **Install dependencies**:
   ```bash
   pip install -r backend/requirements.txt
   cd frontend && npm install && cd ..
   ```

2. **Launch the Web App**:
   ```bash
   python run_web.py
   ```
   Open your browser at **http://localhost:5173** (API Swagger docs at **http://127.0.0.1:8000/docs**).

3. **Web Features**:
   - **Dataset Studio**: Add/manage store catalog items, generate synthetic transaction datasets with a slider, or upload custom CSV/JSON files.
   - **Mining Dashboard**: Interactive sliders for Minimum Support & Minimum Confidence, real-time MapReduce sequential pass progress stepper.
   - **Rules & Analytics**: Interactive tables for frequent itemsets and association rules with Support, Confidence, and Lift indicators, filterable and exportable to CSV/JSON.

## Hadoop workflow

1. Create a one-transaction-per-line CSV file and upload it to HDFS:

   ```bash
   hdfs dfs -mkdir -p /data/market-basket
   hdfs dfs -put dataset_generator/dataset/csv_dataset.csv /data/market-basket/
   ```

2. Locate the Hadoop Streaming JAR and run the driver from `src` (or provide
   an absolute path to the script):

   ```bash
   export HADOOP_STREAMING_JAR="$HADOOP_HOME/share/hadoop/tools/lib/hadoop-streaming-3.x.x.jar"
   python3 src/hadoop_apriori.py /data/market-basket/csv_dataset.csv \
     --minimum-support 250 \
     --output /results/market-basket
   ```

   The driver creates one HDFS output directory per pass and prints the final
   frequent itemsets as JSON. Use `--input-format json` for one JSON array per
   input line. `--max-itemset-length` and `--reducers` control cluster cost.

3. Inspect a pass directly when debugging:

   ```bash
   hdfs dfs -cat /results/market-basket/pass-1/part-*
   ```

For a local smoke test without Hadoop, the workers can be composed through a
Unix pipe:

```bash
printf 'bread,milk,eggs\nbread,eggs\n' |
  python3 src/mapper.py --itemset-length 2 --discarded-file src/discarded_items.json |
  sort |
  python3 src/reducer.py --minimum-support 2
```

## Setup

The original Linux single-cluster onboarding notes remain available in the
[project wiki](https://github.com/BurraAbhishek/Python_Hadoop_MapReduce_MarketBasketAnalysis/wiki/Hadoop-Development-Onboarding-(Linux,-Single-Cluster)).

## Dataset generator

The generator is independent of Hadoop and produces sample input for HDFS:

```bash
python3 dataset_generator/generate_items.py bread
python3 dataset_generator/generate_dataset.py 10000
python3 dataset_generator/generate_csvdataset.py
```

The generated files are ignored by Git. The checked-in `*_sample` files are
small examples for documentation and tests.

## Verification

Run the standard-library test suite:

```bash
python3 -m unittest discover -s tests -v
```

## License

The source code is licensed under the terms of the MIT License.

## References
1. Woo, J. (2013). Market basket analysis algorithms with mapreduce. Wiley Interdisciplinary Reviews: Data Mining and Knowledge Discovery, 3(6), 445-452.
