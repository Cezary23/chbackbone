var notAvailable = "Not Available",
	months =	["January",	"February",	"March",	"April", 
			  	 "May", 	"June", 	"July", 	"August", 
			  	 "September","October", "November", "December"];
window.Monitor = Backbone.Model.extend({
	urlRoot: "/monitors",
	idAttribute: "id",
	defaults: {
		id: '',
		name:'',
		description: '',
		type: '',
		typeDisplay: '',
		enabled: '',
		enabledDisplay: '',
		resultsStart: '',
		resultsEnd: '',
		resultsStartDisplay: '',
		resultsEndDisplay: '',
		tags: []
	},
	initialize: function() {
		// Format Date
		this.formatDateDisplay(this.attributes.resultsStart, 
								this.attributes.resultsEnd);
		// Format Monitor Type (BUZZ -> Buzz)
		var typeOrig = this.attributes.type;
		this.attributes.typeDisplay = firstCharUpperCase(typeOrig);
		// Format Monitor Enabled (true -> True)
		var enabledOrig = (this.attributes.enabled).toString();
		this.attributes.enabledDisplay = firstCharUpperCase(enabledOrig);
	},
	formatDateDisplay: function(dateOne, dateTwo) {
		// Display "Not Avaliable" if no date set
		if(dateOne == "") {
			this.attributes.resultsStartDisplay,
			this.attributes.resultsEndDisplay = notAvailable;
		}
		else // Format Date Otherwise
		{
			this.attributes.resultsStartDisplay = 
				this.formatDate(new Date(dateOne));
			this.attributes.resultsEndDisplay = 
				this.formatDate(new Date(dateTwo));
		}
	},
	formatDate: function(date) {
		// Formats date
		// ex. July 1, 2014 at 12:00 AM
		var hours = date.getUTCHours();
		var minutes = date.getUTCMinutes();
		var AMPM = "AM";
		if(hours > 12) {
			hours = hours - 12;
			AMPM = "PM";
		}
		if(minutes < 10) {
			minutes = "0" + minutes;
		}
		if(hours == 0) {
			hours = "12";
		}
		return months[date.getUTCMonth()] 
				+ " " + date.getUTCDate() 
				+ ", " 
				+ date.getUTCFullYear() 
				+ " at " + hours + ":" 
				+ minutes + " " + AMPM;
	}
});

window.MonitorCollection = Backbone.Collection.extend({
	model: Monitor,
	url: "/api/monitor/list",
	initialize: function() {
		this.fetch();
	},
	parse: function(data){
		return data.monitors;
	}
});

window.Post = Backbone.Model.extend({
	defaults: {
		url: '',
		data:'',
		author: '',
		authorDisplay: '',
		title: '',
		location: '',
		language: '',
		type: '',
		typeDisplay: '',
		categoryScores: [],
		authorKlout: 0,
		authorPosts: 0,
		authorsFollowing: 0,
		authorsFollowers: 0,
		authorGender: ''
	},

	initialize: function(){
		// Format Author to remove ()
		this.attributes.authorDisplay = 
			this.formatAuthor(this.attributes.author);
		// Format Custom to Instagram, GooglePlus, etc.
		this.attributes.typeDisplay = 
			this.formatType(this.attributes.type, this.attributes.url);
	},
	formatAuthor: function(author) {
		// Formats author to remove ()
		// ex. (Crimson Hexagon) -> Crimson Hexagon
		var beg = author.indexOf("(");
		if(beg != -1) {
			beg = (author.indexOf("(") + 1);
			end = author.indexOf(")");
		}
		else{
			beg = 0;
			end = author.length - 1;
		}
		return author.substring(beg, end);	
	},
	formatType: function(type, url) {
		// Formats when Type == Custom
		if(type != "Custom") {
			return type;
		}	
		else
		{
			var index = url.indexOf(".");
			var sub = url.substring(7, index);
			return firstCharUpperCase(sub);
		}
	}
});

window.Tags = Backbone.Model.extend({
	defaults: {
		name: ''
	}
});

window.PostCollection = Backbone.Collection.extend({
	model: Post,
	url: null,
	allCategories: [], 		// Array of All Categories
	avgScores: [],			// Array of Average Scores
	perScores: [],			// Array of Percentages
	arrMentions: [],		// Array of Mentions
	totalScores: 0,			// Total Number of Scores
	numCategories: 0,		// Number of Categories
	initialize: function(options) {
		this.postID = options.postID;
		this.url = "/api/monitor/posts?id=" + options.postID 
					+ "&filter=" + options.filter 
					+ "&extendLimit=false";
		this.fetch();

		var that = this;
		this.on("sync", function(){

			var singlePost = that.at(0),
				singleAttr = singlePost.attributes;

			var arrModels = that.models,
				arrScores = [];

			// Store All Category Names
			that.allCategories = [];
			var categoryNames = singleAttr.categoryScores.map(function(d) {
				return d.categoryName;
			});
			that.allCategories = categoryNames;
			// End

			// Store Average Score
			arrModels.map(function(d,i) {
				d.attributes.categoryScores.map(function(d,i) {
					if(arrScores[i] == undefined) {
						arrScores[i] = 0;
					}
					arrScores[i] += d.score;
				});
			});
			that.avgScores = arrScores;
			// End

			// Store Total Scores
			var totalScores = that.avgScores.reduce(function(a,b){
				return a+b;
			});
			that.totalScores = totalScores;
			// End

			// Store Number of Categories
			that.numCategories = that.allCategories.length;
			// End

			// Store Score Percent
			var arrPercents = arrScores.map(function(d){
				return (d / totalScores) * 100;
			});
			that.perScores = arrPercents;
			// End

			// Store Initial Mentions
			var arrMentions = [];
			for(var i = 0; i < 5; i++) {
				arrMentions.push(new PostsDisplay({
                    model: postCollection.at(i)
                    }).render().el)
			}
			that.arrMentions = arrMentions;
			// End

            that.trigger("ready");

		}, this);
		

	},
	parse: function(data){
		return data.posts;
	}
});

window.MonitorResults = Backbone.Model.extend({
	defaults: {
		startDate: '',
		endDate: '',
		creationDate: '',
		numberOfDocuments: '',
		numberOfReleventDocuments: '',
		categories: [],
	}
});

window.MonitorResultsCollection = Backbone.Collection.extend({
	model: MonitorResults,
	url: null,
	initialize: function(options) {
		this.postID = options.postID;
		this.url = "/api/monitor/results?id=" 
					+ options.postID;
		this.fetch();
	},
	parse: function(data){
		return data.results;
	}
});
function firstCharUpperCase(string) {
	return (string.charAt(0).toUpperCase() + string.slice(1).toLowerCase());
}
