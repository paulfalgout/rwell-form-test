export default{
  "fields": {
    "behavioral_health_intervention": {
      "warning_signs": [
        "Warning Sign #1",
        "Warning Sign #2"
      ],
      "coping_strategies": [
        "Coping Strategy #1"
      ],
      "distractions": [
        {
          "type": "person",
          "name": "John Doe",
          "number": "6033708353"
        }
      ],
      "crisis_help": [
        {
          "name": "John Doe",
          "number": "6033708353"
        }
      ],
      "agencies": {
        "first_agency": {
          "name": "Help Agency",
          "number": "6033708353",
          "contact": "Jane Doe"
        },
        "second_agency": {
          "name": "",
          "number": "",
          "contact": ""
        },
        "first_emergency": {
          "name": "",
          "address": "",
          "number": ""
        }
      },
      "environmental_safety": [
        "Safety Plan #1:",
        "Safety Plan #2:"
      ]
    },
    "behavioral_health_gad": {
      "survey": {
        "1": {
          "question": "Feeling nervous, anxious, or on edge",
          "answer": "Several days"
        },
        "2": {
          "question": "Not being able to stop or control worrying",
          "answer": "Not at all"
        },
        "3": {
          "question": "Worrying too much about different things",
          "answer": "More than half the days"
        },
        "4": {
          "question": "Trouble relaxing",
          "answer": "More than half the days"
        },
        "5": {
          "question": "Being so restless that it is hard to sit still",
          "answer": "Several days"
        },
        "6": {
          "question": "Becoming easily annoyed or irritable",
          "answer": "Several days"
        },
        "7": {
          "question": "Feeling afraid, as if something awful might happen",
          "answer": "Several days"
        }
      },
      "score": 8,
      "severity": "Mild Anxiety",
      "how_difficult": "Very difficult"
    }
  },
  "field_history": {
    "behavioral_health_gad": [
      {
        "score": 8,
        "severity": "Mild Anxiety",
        "date": "2024-10-22T10:06:52-04:00"
      },
      {
        "score": 16,
        "severity": "Moderate Anxiety",
        "date": "2024-08-22T10:06:52-04:00"
      },
      {
        "score": 8,
        "severity": "Mild Anxiety",
        "date": "2024-10-22T10:06:52-04:00"
      },
      {
        "score": 8,
        "severity": "Mild Anxiety",
        "date": "2024-10-22T10:06:52-04:00"
      }
    ]
  },
  "action": {
    "id": "ca25fb79-1f74-49b8-9c89-c5464ed9d5aa"
  },
  "clinician": {
    "id": "0fe5bac9-1149-4e0e-b039-693bd9023edf",
    "name": "John Doe"
  },
  "flow": {
    "metadata": {
      "brief_cbt_sessions_completed": [
        "ca25fb79-1f74-49b8-9c89-c5464ed9d5aa"
      ]
    }
  }
};
